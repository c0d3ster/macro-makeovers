import type { ReactElement } from 'react'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { RecipeImportInput } from '@/validations'

import { sampleRecipe } from '@/tests/fixtures/recipe'

import { RecipePhotoEditor } from './RecipePhotoEditor'

const mockGenerate = vi.fn()
const mockChoose = vi.fn()
vi.mock('@/apiClients', () => ({
  generateRecipePhoto: (...args: unknown[]) => mockGenerate(...args),
  chooseRecipePhoto: (...args: unknown[]) => mockChoose(...args),
}))

const LIVE = 'https://cdn.test/recipes/test-chili.jpg'
const CANDIDATE = 'https://cdn.test/recipes/test-chili-123.jpg'

const Harness = ({
  isSaved = true,
  imageUrl,
}: {
  isSaved?: boolean
  imageUrl?: string
}): ReactElement => {
  const form = useForm<RecipeImportInput>({ defaultValues: sampleRecipe })
  return (
    <FormProvider {...form}>
      <RecipePhotoEditor
        recipeId={isSaved ? 'recipe-1' : undefined}
        imageUrl={imageUrl}
      />
    </FormProvider>
  )
}

const generate = (): void => {
  fireEvent.click(screen.getByRole('button', { name: 'Generate photo' }))
}

describe('RecipePhotoEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerate.mockResolvedValue({ ok: true, url: CANDIDATE })
    mockChoose.mockResolvedValue({ ok: true, url: CANDIDATE })
  })

  it('asks for a first save before it can generate', () => {
    render(<Harness isSaved={false} />)

    expect(screen.getByText(/Save the recipe to generate/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Generate photo' })
    ).not.toBeInTheDocument()
  })

  it('generates from what is on screen, with the notes', async () => {
    render(<Harness imageUrl={LIVE} />)

    fireEvent.change(screen.getByLabelText('Photo notes'), {
      target: { value: 'More cheese' },
    })
    generate()

    await waitFor(() => expect(mockGenerate).toHaveBeenCalled())

    const [recipeId, request] = mockGenerate.mock.calls[0] ?? []

    expect(recipeId).toBe('recipe-1')
    expect(request.get('title')).toBe(sampleRecipe.title)
    expect(request.get('summary')).toBe(sampleRecipe.summary)
    expect(request.get('notes')).toBe('More cheese')
    expect(request.has('sourceUrl')).toBe(false)
  })

  it('shows a candidate without saving it, and refines it on the next try', async () => {
    render(<Harness imageUrl={LIVE} />)

    generate()

    expect(await screen.findByText('Not saved yet')).toBeInTheDocument()
    expect(screen.getByTestId('next-image')).toHaveAttribute('data-src', CANDIDATE)
    expect(mockChoose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(2))

    expect(mockGenerate.mock.calls[1]?.[1].get('sourceUrl')).toBe(CANDIDATE)
  })

  it('makes the candidate the live photo when picked', async () => {
    render(<Harness imageUrl={LIVE} />)

    generate()
    fireEvent.click(await screen.findByRole('button', { name: 'Use this photo' }))

    expect(await screen.findByText('Photo saved.')).toBeInTheDocument()
    expect(mockChoose).toHaveBeenCalledWith('recipe-1', CANDIDATE)
    expect(screen.queryByText('Not saved yet')).not.toBeInTheDocument()
    expect(screen.getByTestId('next-image')).toHaveAttribute('data-src', CANDIDATE)
  })

  it('goes back to the live photo on discard', async () => {
    render(<Harness imageUrl={LIVE} />)

    generate()
    fireEvent.click(await screen.findByRole('button', { name: 'Discard' }))

    expect(screen.getByTestId('next-image')).toHaveAttribute('data-src', LIVE)
    expect(mockChoose).not.toHaveBeenCalled()
  })

  it('shows which stage failed and the reason', async () => {
    mockGenerate.mockResolvedValue({
      ok: false,
      stage: 'generate',
      error: 'OpenAI image request failed with 400: Billing limit',
    })
    render(<Harness />)

    generate()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Image generation failed: OpenAI image request failed with 400: Billing limit'
    )
  })

  it('sends a valid reference and rejects a file it cannot use', async () => {
    render(<Harness />)

    fireEvent.change(screen.getByLabelText(/Reference photo/), {
      target: { files: [new File(['a'], 'notes.txt', { type: 'text/plain' })] },
    })

    expect(screen.getByRole('alert')).toHaveTextContent('JPEG, PNG, or WebP')

    const photo = new File(['a'], 'dish.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText(/Reference photo/), {
      target: { files: [photo] },
    })

    expect(screen.getByText('Reference: dish.png')).toBeInTheDocument()

    generate()

    await waitFor(() => expect(mockGenerate).toHaveBeenCalled())

    expect(mockGenerate.mock.calls[0]?.[1].get('reference')).toBeInstanceOf(File)
  })
})
