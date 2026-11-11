import type { ReactElement } from 'react'

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ComparisonRow, RecipeBuild, RecipeDetail } from '@/libs/recipes'

import { toRecipeView } from '@/libs/recipes'

import { NutritionTable } from './NutritionTable'
import { RecipeHero } from './RecipeHero'
import { RecipeNotes } from './RecipeNotes'
import { ScalableIngredients } from './ScalableIngredients'
import { StepList } from './StepList'

const makeover: RecipeBuild = {
  key: 'standard',
  label: 'Per serving',
  isDefault: true,
  listed: true,
  calories: 500,
  proteinG: 39,
  carbsG: 52,
  fatG: 15,
  swap: {},
}

const rice: RecipeBuild = {
  ...makeover,
  key: 'rice',
  label: 'Rice bowl',
  isDefault: false,
  note: 'Over rice instead',
  calories: 400,
}

const traditional: ComparisonRow = {
  label: 'Traditional per serving',
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
        builds={[makeover]}
        comparisons={[traditional]}
        servings={5}
        selected={makeover}
      />
    )

    const rows = screen.getAllByRole('row')

    expect(rows[1]).toHaveTextContent('Per serving')
    expect(rows[2]).toHaveTextContent('Whole batch (×5)')
    expect(rows[3]).toHaveTextContent('Traditional per serving')
  })

  it('orders the columns carbs, fat, protein', () => {
    render(
      <NutritionTable
        builds={[makeover]}
        comparisons={[]}
        servings={5}
        selected={makeover}
      />
    )

    expect(
      screen.getAllByRole('columnheader').map(({ textContent }) => textContent)
    ).toEqual(['Calories', 'Carbs', 'Fat', 'Protein', 'Ratio C/F/P'])
    expect(screen.getByText('42 / 27 / 31')).toBeInTheDocument()
  })

  it('multiplies the featured build for the whole batch', () => {
    render(
      <NutritionTable
        builds={[makeover]}
        comparisons={[]}
        servings={5}
        selected={makeover}
      />
    )

    expect(screen.getByText('~2,500')).toBeInTheDocument()
    expect(screen.getByText('195g')).toBeInTheDocument()
  })

  it('has a solid background so the page pattern does not show through', () => {
    const { container } = render(
      <NutritionTable
        builds={[makeover]}
        comparisons={[]}
        servings={5}
        selected={makeover}
      />
    )

    expect(container.querySelector('table')?.parentElement).toHaveClass(
      'bg-background'
    )
  })

  it('has no build buttons with a single build', () => {
    render(
      <NutritionTable
        builds={[makeover]}
        comparisons={[]}
        servings={5}
        selected={makeover}
      />
    )

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByText('Tap a build to switch')).toBeNull()
  })

  it('switches builds from the table and follows the selection', () => {
    const onSelect = vi.fn()
    render(
      <NutritionTable
        builds={[makeover, rice]}
        comparisons={[]}
        servings={5}
        selected={rice}
        onSelect={onSelect}
      />
    )

    expect(screen.getByRole('button', { name: 'Rice bowl' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByText('Over rice instead')).toBeInTheDocument()
    // The whole batch multiplies the selected build
    expect(screen.getByText('~2,000')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Per serving' }))

    expect(onSelect).toHaveBeenCalledWith('standard')
  })

  it('does not scroll sideways', () => {
    const { container } = render(
      <NutritionTable
        builds={[makeover]}
        comparisons={[]}
        servings={5}
        selected={makeover}
      />
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
    id: 'recipe-1',
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
    builds: [makeover],
    featured: makeover,
    comparisons: [],
    ingredients: [],
    steps: [],
    nutritionIntro: [],
    nutritionAnalysis: [],
    notes: [],
    variants: [],
  }

  const Hero = ({ value }: { value: RecipeDetail }): ReactElement => (
    <RecipeHero recipe={value} view={toRecipeView(value)} />
  )

  it('labels cost and difficulty beside the title', () => {
    render(<Hero value={recipe} />)

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
    render(<Hero value={recipe} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('servings')).toBeInTheDocument()
    expect(screen.queryByText('Makes')).toBeNull()
  })

  it('sizes each macro segment by its share of calories', () => {
    render(<Hero value={recipe} />)

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
      <Hero value={{ ...recipe, comparisons: [traditional] }} />
    )

    const strip = screen.getByRole('img', {
      name: /original recipe calories by macro/i,
    })

    expect(strip).toHaveClass('macro-reveal-strip')
  })

  it('animates the pills from the original split when there is one', () => {
    const { container } = render(
      <Hero value={{ ...recipe, comparisons: [traditional] }} />
    )

    const pills = container.querySelectorAll('.macro-reveal-pill')

    expect(pills).toHaveLength(3)

    // 30g carbs, 28g fat, 27g protein -> 25 / 52 / 23 by calories (fat and protein tie at .5, so protein rounds up and it adds to 100)
    const startOf = (pill: Element): string =>
      (pill as HTMLElement).style.getPropertyValue('--macro-from')

    expect(Array.from(pills, startOf)).toEqual(['25', '52', '23'])
  })

  it('grows the pills from nothing without a traditional build', () => {
    const { container } = render(<Hero value={recipe} />)

    expect(
      container.querySelectorAll('.macro-reveal-pill-from-zero')
    ).toHaveLength(3)
    expect(container.querySelector('.macro-reveal-pill')).toBeNull()
  })

  it('leaves the strip out without a traditional build', () => {
    render(<Hero value={recipe} />)

    expect(screen.queryByRole('img', { name: /original/i })).toBeNull()
  })

  it('shows the selected build', () => {
    const value = {
      ...recipe,
      builds: [makeover, { ...rice, title: 'Rice Bowl Chili' }],
    }
    render(<RecipeHero recipe={value} view={toRecipeView(value, 'rice')} />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Rice Bowl Chili' })
    ).toBeInTheDocument()
    expect(screen.getByText('400')).toBeInTheDocument()
  })

  it('holds a place for the photo until there is one', () => {
    render(<Hero value={recipe} />)

    expect(
      screen.getByRole('img', { name: 'Photo of Test Chili coming soon' })
    ).toBeInTheDocument()
  })

  it('sends the photo through the image optimizer', () => {
    render(
      <Hero
        value={{ ...recipe, imageUrl: 'https://images.example.com/recipes/spicy-turkey-chili.jpg' }}
      />
    )

    expect(screen.getByTestId('next-image')).toHaveAttribute(
      'data-src',
      'https://images.example.com/recipes/spicy-turkey-chili.jpg'
    )
  })

  it('shows the photo once there is one', () => {
    render(
      <Hero
        value={{ ...recipe, imageUrl: 'https://images.example.com/recipes/spicy-turkey-chili.jpg' }}
      />
    )

    expect(screen.getByTestId('next-image')).toHaveAttribute('data-src', 'https://images.example.com/recipes/spicy-turkey-chili.jpg')
  })
})
