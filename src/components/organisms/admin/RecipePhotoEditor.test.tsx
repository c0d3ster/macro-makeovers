import type { ReactElement } from 'react'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { RecipeImportInput } from '@/validations'

import { sampleRecipe } from '@/tests/fixtures/recipe'

import { RecipePhotoEditor } from './RecipePhotoEditor'

const mockGenerate = vi.fn()
const mockUpload = vi.fn()
vi.mock('@/apiClients', () => ({
  generateRecipePhoto: (...args: unknown[]) => mockGenerate(...args),
  uploadRecipePhoto: (...args: unknown[]) => mockUpload(...args),
}))

// jsdom has no canvas, so photos go up as picked
vi.mock('@/utils/shrinkPhoto', () => ({
  shrinkPhoto: (file: File) => Promise.resolve(file),
}))

const LIVE = 'https://cdn.test/recipes/test-chili.jpg'
const CANDIDATE = 'https://cdn.test/recipes/test-chili-123.jpg'
const onChoose = vi.fn()

const Harness = ({
  imageUrl,
  isSaved = true,
}: {
  imageUrl?: string
  isSaved?: boolean
}): ReactElement => {
  const form = useForm<RecipeImportInput>({ defaultValues: sampleRecipe })
  return (
    <FormProvider {...form}>
      <RecipePhotoEditor
        imageUrl={imageUrl}
        onChoose={onChoose}
        isSaved={isSaved}
      />
    </FormProvider>
  )
}

const photo = (name = 'dish.png', type = 'image/png'): File =>
  new File(['a'], name, { type })

const sentForm = (mock: typeof mockGenerate, call = 0): FormData =>
  mock.mock.calls[call]?.[0]

describe('RecipePhotoEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerate.mockResolvedValue({ ok: true, url: CANDIDATE })
    mockUpload.mockResolvedValue({ ok: true, url: CANDIDATE })
    onChoose.mockImplementation((url: string) => Promise.resolve({ ok: true, url }))
  })

  it('invites an upload in the empty photo slot, even before the first save', async () => {
    render(<Harness isSaved={false} />)

    const slot = screen.getByRole('button', {
      name: 'Import photo or generate below',
    })
    const picker = screen.getByLabelText('Upload a photo')
    const opened = vi.spyOn(picker, 'click')
    fireEvent.click(slot)

    expect(opened).toHaveBeenCalled()

    fireEvent.change(picker, { target: { files: [photo()] } })

    expect(await screen.findByText('Not saved yet')).toBeInTheDocument()
    expect(sentForm(mockUpload).get('photo')).toBeInstanceOf(File)
    expect(sentForm(mockUpload).get('slug')).toBe(sampleRecipe.slug)
  })

  it('generates from what is on screen, with the notes', async () => {
    render(<Harness imageUrl={LIVE} />)

    fireEvent.change(screen.getByLabelText('Photo notes'), {
      target: { value: 'More cheese' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Generate photo' }))

    await waitFor(() => expect(mockGenerate).toHaveBeenCalled())

    const request = sentForm(mockGenerate)

    expect(request.get('title')).toBe(sampleRecipe.title)
    expect(request.get('summary')).toBe(sampleRecipe.summary)
    expect(request.get('notes')).toBe('More cheese')
    expect(request.has('sourceUrl')).toBe(false)
  })

  it('uses the current photo as a reference only when asked', async () => {
    render(<Harness imageUrl={LIVE} />)

    fireEvent.click(screen.getByLabelText('Use the current photo as a reference'))
    fireEvent.click(screen.getByRole('button', { name: 'Generate photo' }))

    await waitFor(() => expect(mockGenerate).toHaveBeenCalled())

    expect(sentForm(mockGenerate).get('sourceUrl')).toBe(LIVE)
  })

  it('sends a reference photo picked with the button, and refuses one it cannot use', async () => {
    render(<Harness />)

    const picker = screen.getByLabelText('Reference photo')
    const opened = vi.spyOn(picker, 'click')
    fireEvent.click(screen.getByRole('button', { name: 'Add reference photo' }))

    expect(opened).toHaveBeenCalled()

    fireEvent.change(picker, { target: { files: [photo('notes.txt', 'text/plain')] } })

    expect(await screen.findByRole('alert')).toHaveTextContent('JPEG, PNG, or WebP')

    fireEvent.change(picker, { target: { files: [photo()] } })

    expect(await screen.findByText('Reference: dish.png')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Generate photo' }))

    await waitFor(() => expect(mockGenerate).toHaveBeenCalled())

    expect(sentForm(mockGenerate).get('reference')).toBeInstanceOf(File)
  })

  it('keeps a candidate unsaved until it is chosen', async () => {
    render(<Harness imageUrl={LIVE} />)

    fireEvent.click(screen.getByRole('button', { name: 'Generate photo' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Use this photo' }))

    expect(await screen.findByText('Photo saved.')).toBeInTheDocument()
    expect(onChoose).toHaveBeenCalledWith(CANDIDATE)
    expect(screen.queryByText('Not saved yet')).not.toBeInTheDocument()
  })

  it('says a photo for a new recipe saves with it', async () => {
    render(<Harness isSaved={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Generate photo' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Use this photo' }))

    expect(
      await screen.findByText('This photo will be saved with the recipe.')
    ).toBeInTheDocument()
  })

  it('goes back to the recipe photo on discard', async () => {
    render(<Harness imageUrl={LIVE} />)

    fireEvent.click(screen.getByRole('button', { name: 'Generate photo' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Discard' }))

    expect(screen.getByTestId('next-image')).toHaveAttribute('data-src', LIVE)
    expect(onChoose).not.toHaveBeenCalled()
  })

  it('shows which stage failed and the reason', async () => {
    mockGenerate.mockResolvedValue({
      ok: false,
      stage: 'generate',
      error: 'OpenAI image request failed with 400: Billing limit',
    })
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'Generate photo' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Image generation failed: OpenAI image request failed with 400: Billing limit'
    )
  })
})
