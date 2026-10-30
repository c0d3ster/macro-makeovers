import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { RecipeCard as RecipeCardData } from '@/libs/recipes'

import { RecipeCard } from './RecipeCard'
import { RecipeGrid } from './RecipeGrid'

const recipe: RecipeCardData = {
  slug: 'test-chili',
  title: 'Test Chili',
  summary: 'A test recipe',
  servings: 5,
  totalMinutes: 70,
  costTier: 2,
  difficulty: 3,
  tags: ['chili', 'turkey', 'stovetop', 'batch friendly'],
  calories: 500,
  proteinG: 39,
  carbsG: 52,
  fatG: 15,
}

describe('RecipeCard', () => {
  it('links to the recipe page', () => {
    render(<RecipeCard recipe={recipe} />)

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/recipes/test-chili'
    )
  })

  it('shows the macros, time, cost, and difficulty', () => {
    render(<RecipeCard recipe={recipe} />)

    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('cals per serving')).toBeInTheDocument()
    expect(screen.getByText('31%')).toBeInTheDocument()
    expect(screen.getByText('39g')).toBeInTheDocument()
    expect(screen.getByText('1 hr 10 min')).toBeInTheDocument()
    expect(screen.getByLabelText('Cost 2 of 5')).toBeInTheDocument()
    expect(screen.getByLabelText('Difficulty 3 of 5')).toBeInTheDocument()
  })

  it('shows at most three tags', () => {
    render(<RecipeCard recipe={recipe} />)

    expect(screen.getByText('chili')).toBeInTheDocument()
    expect(screen.queryByText('batch friendly')).not.toBeInTheDocument()
  })
})

describe('RecipeGrid', () => {
  it('renders one card per recipe', () => {
    render(
      <RecipeGrid
        recipes={[recipe, { ...recipe, slug: 'other', title: 'Other' }]}
      />
    )

    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('says so when there are no recipes', () => {
    render(<RecipeGrid recipes={[]} />)

    expect(screen.getByText(/No recipes yet/)).toBeInTheDocument()
  })
})
