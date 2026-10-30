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
    nutritionIntro: [],
    nutritionAnalysis: [],
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

  it('shows the servings beside the calories', () => {
    render(<RecipeHero recipe={recipe} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('servings')).toBeInTheDocument()
    expect(screen.queryByText('Makes')).toBeNull()
  })

  it('sizes each macro segment by its share of calories', () => {
    render(<RecipeHero recipe={recipe} />)

    // 52g carbs, 15g fat, 39g protein -> 42 / 27 / 31
    const widths = ['Carbs', 'Fat', 'Protein'].map((label) =>
      screen.getByText(label).closest('[style]')?.getAttribute('style')
    )

    expect(
      widths.map((style) => style?.match(/flex-grow: (\d+)/)?.[1])
    ).toEqual(['42', '27', '31'])
  })

  it('shows the original recipe ratio under the macros', () => {
    render(
      <RecipeHero recipe={{ ...recipe, nutrition: [makeover, traditional] }} />
    )

    expect(
      screen.getByRole('img', { name: /original recipe calories by macro/i })
    ).toBeInTheDocument()
  })

  it('animates the pills from the original split when there is one', () => {
    const { container } = render(
      <RecipeHero recipe={{ ...recipe, nutrition: [makeover, traditional] }} />
    )

    const pills = container.querySelectorAll('.macro-reveal-pill')

    expect(pills).toHaveLength(3)
    // 30g carbs, 28g fat, 27g protein -> 25 / 53 / 23 by calories
    expect(
      Array.from(pills, (pill) =>
        (pill as HTMLElement).style.getPropertyValue('--macro-from')
      )
    ).toEqual(['25', '53', '23'])
  })

  it('does not animate without a traditional build', () => {
    const { container } = render(<RecipeHero recipe={recipe} />)

    expect(container.querySelector('.macro-reveal-pill')).toBeNull()
  })

  it('leaves the strip out without a traditional build', () => {
    render(<RecipeHero recipe={recipe} />)

    expect(screen.queryByRole('img', { name: /original/i })).toBeNull()
  })

  it('holds a place for the photo until there is one', () => {
    render(<RecipeHero recipe={recipe} />)

    expect(
      screen.getByRole('img', { name: 'Photo of Test Chili coming soon' })
    ).toBeInTheDocument()
  })

  it('shows a stand-in photo from public/ through the image optimizer', () => {
    render(
      <RecipeHero
        recipe={{ ...recipe, imageUrl: '/images/02-spicy-turkey-chili.jpg' }}
      />
    )

    expect(screen.getByTestId('next-image')).toHaveAttribute(
      'data-src',
      '/images/02-spicy-turkey-chili.jpg'
    )
  })

  it('shows the photo once there is one', () => {
    render(
      <RecipeHero
        recipe={{ ...recipe, imageUrl: 'https://example.com/chili.jpg' }}
      />
    )

    expect(screen.getByRole('img', { name: 'Test Chili' })).toHaveAttribute(
      'src',
      'https://example.com/chili.jpg'
    )
  })
})
