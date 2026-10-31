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

describe('RecipeCard original macro strip', () => {
  it('shows the original recipe ratio when there is one', () => {
    render(
      <RecipeCard
        recipe={{
          ...recipe,
          original: { proteinG: 27, carbsG: 30, fatG: 28 },
        }}
      />
    )

    expect(
      screen.getByRole('img', { name: /original recipe calories by macro/i })
    ).toBeInTheDocument()
  })

  it('leaves the strip out without original macros', () => {
    render(<RecipeCard recipe={recipe} />)

    expect(screen.queryByRole('img', { name: /original/i })).toBeNull()
  })
})

describe('RecipeCard photo', () => {
  it('shows the photo above the title when there is one', () => {
    render(
      <RecipeCard
        recipe={{ ...recipe, imageUrl: '/images/02-spicy-turkey-chili.jpg' }}
      />
    )

    expect(screen.getByTestId('next-image')).toHaveAttribute(
      'data-src',
      '/images/02-spicy-turkey-chili.jpg'
    )
  })

  it('leaves out the photo area when there is none', () => {
    render(<RecipeCard recipe={recipe} />)

    expect(screen.queryByTestId('next-image')).toBeNull()
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

describe('RecipeCard fit', () => {
  it('shows nothing extra when there is no goal', () => {
    render(<RecipeCard recipe={recipe} />)

    expect(screen.queryByText('Good fit')).not.toBeInTheDocument()
  })

  it('tags a good fit with text, not color alone', () => {
    render(<RecipeCard recipe={recipe} fit={{ isFit: true }} />)

    expect(screen.getByText('Good fit')).toBeInTheDocument()
  })

  it('gives the reason a recipe is not a good fit', () => {
    render(
      <RecipeCard
        recipe={recipe}
        fit={{ isFit: false, reason: 'Over 550 cal' }}
      />
    )

    expect(screen.getByText('Over 550 cal')).toBeInTheDocument()
    expect(screen.queryByText('Good fit')).not.toBeInTheDocument()
  })
})

describe('RecipeGrid dividers', () => {
  const recipes = ['a', 'b', 'c', 'd'].map((slug) => ({
    ...recipe,
    slug,
    title: slug.toUpperCase(),
  }))
  const fits = {
    a: { isFit: true },
    b: { isFit: true },
    c: { isFit: false, reason: 'Over 550 cal' },
    d: { isFit: false, reason: 'Over 550 cal' },
  }

  it('labels the close matches and the rest', () => {
    render(<RecipeGrid recipes={recipes} fits={fits} showDividers />)

    expect(
      screen.getByRole('heading', { name: '2 close matches' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Other recipes' })
    ).toBeInTheDocument()
  })

  it('says "1 close match" for a single fit', () => {
    render(
      <RecipeGrid
        recipes={recipes}
        fits={{ ...fits, b: { isFit: false } }}
        showDividers
      />
    )

    expect(
      screen.getByRole('heading', { name: '1 close match' })
    ).toBeInTheDocument()
  })

  it('leaves the dividers out when every recipe or none fits', () => {
    const all = Object.fromEntries(recipes.map(({ slug }) => [slug, { isFit: true }]))
    const none = Object.fromEntries(recipes.map(({ slug }) => [slug, { isFit: false }]))

    const { rerender } = render(
      <RecipeGrid recipes={recipes} fits={all} showDividers />
    )

    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)

    rerender(<RecipeGrid recipes={recipes} fits={none} showDividers />)

    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
  })

  it('leaves them out when another sort has scattered the fits', () => {
    const scattered = [recipes[2]!, recipes[0]!, recipes[3]!, recipes[1]!]

    render(<RecipeGrid recipes={scattered} fits={fits} showDividers />)

    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
  })

  it('leaves them out unless asked', () => {
    render(<RecipeGrid recipes={recipes} fits={fits} />)

    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
  })
})
