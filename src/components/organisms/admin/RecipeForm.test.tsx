import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sampleRecipe } from '@/tests/fixtures/recipe'

import { RecipeForm } from './RecipeForm'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

// The form saves through useSaveRecipe, which wraps the importRecipe mutation
const mockSave = vi.fn()
vi.mock('@/apiClients', async () => ({
  ...(await vi.importActual('@/apiClients')),
  useSaveRecipe: () => mockSave,
}))

const makeover = {
  kind: 'makeover',
  label: 'Base',
  isDefault: false,
  calories: 400,
  carbsG: 40,
  fatG: 10,
  proteinG: 30,
} as const

describe('RecipeForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('saves the edited recipe and shows the result', async () => {
    mockSave.mockResolvedValue({
      ok: true,
      id: 'recipe-1',
      slug: sampleRecipe.slug,
      summary: 'Saved.',
    })
    render(<RecipeForm recipeId='recipe-1' initial={sampleRecipe} />)

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'A better title' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(mockSave).toHaveBeenCalled())

    expect(mockSave).toHaveBeenCalledWith(
      'recipe-1',
      expect.objectContaining({ title: 'A better title' })
    )
    expect(await screen.findByRole('status')).toHaveTextContent('Saved.')
  })

  it('locks the slug when editing', () => {
    render(<RecipeForm recipeId='recipe-1' initial={sampleRecipe} />)

    expect(screen.getByLabelText('Slug')).toHaveAttribute('readonly')
  })

  it('links to the preview of the saved recipe only when editing', () => {
    const { rerender } = render(
      <RecipeForm recipeId='recipe-1' initial={sampleRecipe} />
    )

    expect(
      screen.getByRole('link', { name: 'Preview saved version' })
    ).toHaveAttribute('href', '/admin/recipes/recipe-1/preview')

    rerender(<RecipeForm initial={sampleRecipe} />)

    expect(
      screen.queryByRole('link', { name: 'Preview saved version' })
    ).not.toBeInTheDocument()
  })

  it('updates the hero calories and ratio while the nutrition table is edited', () => {
    render(<RecipeForm recipeId='recipe-1' initial={sampleRecipe} />)

    fireEvent.change(screen.getByLabelText('Nutrition row 1 calories'), {
      target: { value: '512' },
    })

    expect(screen.getByText('512')).toBeInTheDocument()
    expect(screen.getByText('~2,048')).toBeInTheDocument()
  })

  it('keeps one featured row, and moves it when another is picked', async () => {
    mockSave.mockResolvedValue({ ok: false, error: 'stop' })
    render(
      <RecipeForm
        initial={{
          ...sampleRecipe,
          nutrition: [
            { ...makeover, label: 'Base', isDefault: true },
            { ...makeover, label: 'Loaded', isDefault: false },
          ],
        }}
      />
    )

    const [, loaded] = screen.getAllByRole('radio', { name: 'Featured' })
    fireEvent.click(loaded!)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(mockSave).toHaveBeenCalled())

    expect(mockSave.mock.calls[0]?.[1].nutrition).toEqual([
      expect.objectContaining({ label: 'Base', isDefault: false }),
      expect.objectContaining({ label: 'Loaded', isDefault: true }),
    ])
  })

  it('saves cost, tags, and a group rename across every line in the group', async () => {
    mockSave.mockResolvedValue({ ok: false, error: 'stop' })
    render(
      <RecipeForm
        initial={{
          ...sampleRecipe,
          tags: ['chili'],
          ingredients: [
            { group: 'Sauce', raw: '1 cup broth' },
            { group: 'Sauce', raw: '2 tbsp soy sauce' },
          ],
        }}
      />
    )

    fireEvent.click(screen.getByRole('radio', { name: 'Cost 4 of 5' }))

    const addTag = screen.getByLabelText('Add tag')
    fireEvent.change(addTag, { target: { value: 'quick' } })
    fireEvent.keyDown(addTag, { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'Remove tag chili' }))

    const group = screen.getByLabelText('Group name Sauce')
    fireEvent.change(group, { target: { value: 'Glaze' } })
    fireEvent.blur(group)

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(mockSave).toHaveBeenCalled())

    const saved = mockSave.mock.calls[0]?.[1]

    expect(saved.costTier).toBe(4)
    expect(saved.tags).toEqual(['quick'])
    expect(saved.ingredients).toEqual([
      expect.objectContaining({ group: 'Glaze', raw: '1 cup broth' }),
      expect.objectContaining({ group: 'Glaze', raw: '2 tbsp soy sauce' }),
    ])
  })

  it('starts a new line in the same group when Enter is pressed on an ingredient', async () => {
    render(
      <RecipeForm
        initial={{
          ...sampleRecipe,
          ingredients: [{ group: 'Sauce', raw: '1 cup broth' }],
        }}
      />
    )

    fireEvent.keyDown(screen.getByLabelText('Ingredient 1'), { key: 'Enter' })

    expect(await screen.findByLabelText('Ingredient 2')).toHaveValue('')
    expect(screen.getByLabelText('Ingredient 2 group')).toHaveValue('Sauce')
  })

  it('adds a prep step ahead of the cook steps', async () => {
    mockSave.mockResolvedValue({ ok: false, error: 'stop' })
    render(<RecipeForm initial={sampleRecipe} />)

    fireEvent.click(screen.getByRole('button', { name: '+ Add prep step' }))
    fireEvent.change(await screen.findByLabelText('Step 2'), {
      target: { value: 'Chop the garlic' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(mockSave).toHaveBeenCalled())

    expect(mockSave.mock.calls[0]?.[1].steps).toEqual([
      expect.objectContaining({ phase: 'prep', body: 'Dice the onion' }),
      expect.objectContaining({ phase: 'prep', body: 'Chop the garlic' }),
      expect.objectContaining({ phase: 'cook', body: 'Stir for 15 seconds' }),
    ])
  })

  it('does not submit when Enter is pressed in a single-line field', () => {
    render(<RecipeForm initial={sampleRecipe} />)

    // fireEvent returns false when the default action, here the implicit submit, was prevented
    expect(
      fireEvent.keyDown(screen.getByLabelText('Slug'), { key: 'Enter' })
    ).toBe(false)
  })

  it('shows the saved photo in the photo slot', () => {
    render(
      <RecipeForm
        recipeId='recipe-1'
        initial={sampleRecipe}
        imageUrl='https://images.example.com/chili.jpg'
      />
    )

    expect(screen.getByTestId('next-image')).toHaveAttribute(
      'data-src',
      'https://images.example.com/chili.jpg'
    )
  })

  it('blocks a save with an empty title and does not call the mutation', async () => {
    render(<RecipeForm initial={sampleRecipe} />)

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
    expect(mockSave).not.toHaveBeenCalled()
  })
})
