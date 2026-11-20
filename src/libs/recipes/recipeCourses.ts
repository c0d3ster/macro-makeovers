import type { CardBuild, RecipeCard } from './recipeCards'

import { cardForBuild } from './recipeCards'

// What a dish is on a menu. A build can override the recipe's course, so a Greek salad can be a
// side by default and a main with grilled chicken. Values mirror the Postgres enum.
export const RECIPE_COURSES = [
  'breakfast',
  'appetizer',
  'main',
  'side',
  'sauce',
] as const

export type RecipeCourse = (typeof RECIPE_COURSES)[number]

export const COURSE_LABELS: Record<RecipeCourse, string> = {
  breakfast: 'Breakfast',
  appetizer: 'Appetizer',
  main: 'Entrée',
  side: 'Side',
  sauce: 'Sauce',
}

// The courses the main grid, filters, and goal matching show
export const DISH_COURSES: readonly RecipeCourse[] = ['breakfast', 'main']

// The courses the appetizers, sides and sauces section shows, as compact cards
export const SIDE_COURSES: readonly RecipeCourse[] = ['appetizer', 'side', 'sauce']

// The anchor of the appetizers, sides and sauces section on /recipes, which their pages link to
export const SIDES_SECTION_ID = 'sides-and-sauces'

export const isSideCourse = (course: RecipeCourse): boolean =>
  SIDE_COURSES.includes(course)

// The builds a card can lead with: every listed build, and always the default
const canLead = ({ listed, isDefault }: CardBuild): boolean =>
  listed || isDefault

// Each card kept to its builds in these courses, led by the default when it is one of them, else
// the first that can lead. A recipe with none is left out. So a recipe shows at most once per
// section, and can show in two: Greek salad as a side, and with chicken as a main.
export const cardsForCourses = (
  cards: RecipeCard[],
  courses: readonly RecipeCourse[]
): RecipeCard[] =>
  cards.flatMap((card) => {
    const builds = card.builds.filter(
      (build) => courses.includes(build.course) && canLead(build)
    )
    const lead = builds.find(({ isDefault }) => isDefault) ?? builds[0]
    return lead ? [cardForBuild({ ...card, builds }, lead)] : []
  })
