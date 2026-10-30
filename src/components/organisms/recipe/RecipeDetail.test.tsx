import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { NutritionBuild, RecipeDetail } from '@/libs/recipes'

import { NutritionTable } from './NutritionTable'
import { RecipeHero } from './RecipeHero'
import { RecipeNotes } from './RecipeNotes'
import { ScalableIngredients } from './ScalableIngredients'
import { StepList } from './StepList'

const makeover: NutritionBuild = {
  kind: 'makeover',
  label: 'Per serving',
  isDefault: true,
  calories: 500,
  proteinG: 39,
  carbsG: 52,
  fatG: 15,
}

const traditional: NutritionBuild = {
  kind: 'traditional',
  label: 'Traditional per serving',
  isDefault: false,
  calories: 480,
  proteinG: 27,
  carbsG: 30,
  fatG: 28,
}

describe('ScalableIngredients', () => {
  const ingredients = [
    { group: 'Marinade', raw: '1/2 cup soy sauce' },
    { group: 'Marinade', raw: '2 tbsp brown sugar' },
    { raw: 'Salt' },
  ]

  it('shows the amounts as written at the base serving size', () => {
    render(<ScalableIngredients ingredients={ingredients} baseServings={4} />)

    expect(screen.getByText('1/2 cup soy sauce')).toBeInTheDocument()
    expect(screen.getByText('Marinade')).toBeInTheDocument()
    expect(screen.queryByText(/Scaled from/)).not.toBeInTheDocument()
  })

  it('scales the amounts when servings go up', () => {
    render(<ScalableIngredients ingredients={ingredients} baseServings={4} />)

    // 4 -> 8 servings doubles everything
    Array.from({ length: 4 }).forEach(() =>
      fireEvent.click(screen.getByRole('button', { name: 'More servings' }))
    )

    expect(screen.getByText('1 cup soy sauce')).toBeInTheDocument()
    expect(screen.getByText('4 tbsp brown sugar')).toBeInTheDocument()
    expect(screen.getByText('Salt')).toBeInTheDocument()
    expect(screen.getByText(/Scaled from 4 servings/)).toBeInTheDocument()
  })

  it('goes back to the original amounts on reset', () => {
    render(<ScalableIngredients ingredients={ingredients} baseServings={4} />)

    fireEvent.click(screen.getByRole('button', { name: 'Fewer servings' }))

    expect(screen.getByText('3/8 cup soy sauce')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByText('1/2 cup soy sauce')).toBeInTheDocument()
  })

  it('stops at one serving', () => {
    render(<ScalableIngredients ingredients={ingredients} baseServings={1} />)

    expect(
      screen.getByRole('button', { name: 'Fewer servings' })
    ).toBeDisabled()
  })
})

describe('NutritionTable', () => {
  it('lists every build with the whole batch before the traditional row', () => {
    render(
      <NutritionTable
        builds={[traditional, makeover]}
        servings={5}
        featured={makeover}
      />
    )

    const rows = screen.getAllByRole('row')

    expect(rows[1]).toHaveTextContent('Per serving')
    expect(rows[2]).toHaveTextContent('Whole batch (×5)')
    expect(rows[3]).toHaveTextContent('Traditional per serving')
  })

  it('orders the columns carbs, fat, protein', () => {
    render(
      <NutritionTable builds={[makeover]} servings={5} featured={makeover} />
    )

    expect(
      screen.getAllByRole('columnheader').map(({ textContent }) => textContent)
    ).toEqual(['Calories', 'Carbs', 'Fat', 'Protein', 'Ratio C/F/P'])
    expect(screen.getByText('42 / 27 / 31')).toBeInTheDocument()
  })

  it('multiplies the featured build for the whole batch', () => {
    render(
      <NutritionTable builds={[makeover]} servings={5} featured={makeover} />
    )

    expect(screen.getByText('~2,500')).toBeInTheDocument()
    expect(screen.getByText('195g')).toBeInTheDocument()
  })

  it('does not scroll sideways', () => {
    const { container } = render(
      <NutritionTable builds={[makeover]} servings={5} featured={makeover} />
    )

    expect(container.querySelector('.overflow-x-auto')).toBeNull()
  })
})

describe('StepList', () => {
  it('numbers steps straight through prep and cook', () => {
    render(
      <StepList
        steps={[
          { phase: 'prep', body: 'Chop the onion' },
          { phase: 'cook', body: 'Sear the beef', durationMinutes: 10 },
        ]}
        prepMinutes={10}
        cookMinutes={40}
      />
    )

    const items = screen.getAllByRole('listitem')

    expect(items[0]).toHaveTextContent('1Chop the onion')
    expect(items[1]).toHaveTextContent('2Sear the beef')
    expect(screen.getByText('About 10 min')).toBeInTheDocument()
  })

  it('shows how long each phase takes', () => {
    render(
      <StepList
        steps={[
          { phase: 'prep', body: 'Chop the onion' },
          { phase: 'cook', body: 'Sear the beef' },
        ]}
        prepMinutes={10}
        cookMinutes={70}
      />
    )

    expect(screen.getByRole('heading', { name: /Prep/ })).toHaveTextContent(
      '(~10 min)'
    )
    expect(screen.getByRole('heading', { name: /Cook/ })).toHaveTextContent(
      '(~1 hr 10 min)'
    )
  })

  it('renders markdown in a step', () => {
    render(
      <StepList
        steps={[{ phase: 'cook', body: 'Cook **hot**' }]}
        prepMinutes={0}
        cookMinutes={5}
      />
    )

    expect(screen.getByText('hot').tagName).toBe('STRONG')
  })
})

describe('RecipeNotes', () => {
  it('groups notes under their section and skips empty sections', () => {
    render(
      <RecipeNotes
        notes={[
          { kind: 'make_or_break', body: 'Use cast iron' },
          { kind: 'fixes', body: 'Too thin? Simmer longer' },
        ]}
      />
    )

    expect(screen.getByText('Make or break')).toBeInTheDocument()
    expect(screen.getByText('Fixes')).toBeInTheDocument()
    expect(screen.queryByText('Levers')).not.toBeInTheDocument()
  })

  it('renders nothing when there are no notes', () => {
    const { container } = render(<RecipeNotes notes={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('RecipeHero', () => {
  const recipe: RecipeDetail = {
    slug: 'test-chili',
    title: 'Test Chili',
    summary: 'A test recipe.',
    servings: 5,
    prepMinutes: 10,
    cookMinutes: 40,
    totalMinutes: 50,
    costTier: 2,
    difficulty: 3,
    tags: [],
    nutrition: [makeover],
    featured: makeover,
    ingredients: [],
    steps: [],
    notes: [],
    variants: [],
  }

  it('labels cost and difficulty beside the title', () => {
    render(<RecipeHero recipe={recipe} />)

    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('50 min')).toBeInTheDocument()
    expect(screen.getByText('Cost')).toBeInTheDocument()
    expect(screen.getByText('Difficulty')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Cost 2 of 5' })).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Difficulty 3 of 5' })
    ).toBeInTheDocument()
  })
})
