import { describe, expect, it } from 'vitest'

import { withSingleBuild } from '@/tests/fixtures/recipeCard'

import type { CardBuild, RecipeCard } from './recipeCards'

import { cardsForCourses, DISH_COURSES, SIDE_COURSES } from './recipeCourses'

const face = {
  summary: '',
  servings: 4,
  totalMinutes: 20,
  costTier: 1,
  difficulty: 1,
  tags: [],
  carbsG: 10,
  fatG: 5,
  proteinG: 5,
}

const card = (slug: string, course: RecipeCard['course']): RecipeCard =>
  withSingleBuild({ ...face, slug, title: slug, calories: 100, course })

// Greek salad: a side by default, and a main with grilled chicken
const salad = ((): RecipeCard => {
  const side = card('greek-salad', 'side')
  const chicken: CardBuild = {
    ...(side.builds[0] as CardBuild),
    key: 'chicken',
    label: 'With grilled chicken',
    isDefault: false,
    title: 'Grilled Chicken Greek Salad',
    course: 'main',
    calories: 480,
  }
  return { ...side, builds: [...(side.builds as CardBuild[]), chicken] }
})()

describe('cardsForCourses', () => {
  it('keeps each recipe in the section its course belongs to', () => {
    const cards = [card('chili', 'main'), card('salsa', 'sauce')]

    expect(cardsForCourses(cards, DISH_COURSES).map(({ slug }) => slug)).toEqual([
      'chili',
    ])
    expect(cardsForCourses(cards, SIDE_COURSES).map(({ slug }) => slug)).toEqual([
      'salsa',
    ])
  })

  it('shows a recipe in two sections when its builds are different courses', () => {
    const [asMain] = cardsForCourses([salad], DISH_COURSES)
    const [asSide] = cardsForCourses([salad], SIDE_COURSES)

    expect(asMain?.build.key).toBe('chicken')
    expect(asMain?.title).toBe('Grilled Chicken Greek Salad')
    expect(asMain?.calories).toBe(480)
    expect(asMain?.builds.map(({ key }) => key)).toEqual(['chicken'])
    expect(asSide?.build.key).toBe('makeover')
    expect(asSide?.calories).toBe(100)
  })

  it('leaves out builds that cannot lead a card', () => {
    const hidden: RecipeCard = {
      ...salad,
      builds: salad.builds.map((build) =>
        build.key === 'chicken' ? { ...build, listed: false } : build
      ),
    }

    expect(cardsForCourses([hidden], DISH_COURSES)).toEqual([])
  })
})
