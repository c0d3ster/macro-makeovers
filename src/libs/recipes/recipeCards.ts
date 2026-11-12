import type { MacroValues, RecipeBuild } from './recipeBuilds'
import type { RecipeCourse } from './recipeCourses'
import type { RecipeBuildRow } from './recipeDetail'

import { buildHref, defaultBuild, resolveBuild } from './recipeBuilds'
import { toRecipeBuilds } from './recipeDetail'

// The fields a card shows that a build can change
type CardFace = MacroValues & {
  title: string
  summary: string
  // The build's photo, else the recipe's (an R2 URL), if there is one
  imageUrl?: string
  totalMinutes: number
  costTier: number
  difficulty: number
  // Which section the card shows in
  course: RecipeCourse
  tags: string[]
}

// One build as a card would show it
export type CardBuild = CardFace & Pick<RecipeBuild, 'key' | 'label' | 'isDefault' | 'listed'>

// What the grid needs to draw one recipe: headline facts for the build it shows, plus every
// build so filters can pick a different one
export type RecipeCard = CardFace & {
  slug: string
  servings: number
  // The build these facts are for
  build: Pick<RecipeBuild, 'key' | 'label' | 'isDefault'>
  builds: CardBuild[]
  // The traditional version's macros, when the recipe has one
  original?: { proteinG: number; carbsG: number; fatG: number }
  // Published dishes that use this recipe as a side or sauce
  usedInCount: number
}

type NutritionRow = MacroValues & {
  kind: 'makeover' | 'traditional'
}

// A recipe as the database returns it for the grid, with its builds and tags attached
export type RecipeCardRow = {
  slug: string
  title: string
  summary: string
  servings: number
  prepMinutes: number
  cookMinutes: number
  costTier: number
  difficulty: number
  course: RecipeCourse
  imageUrl: string | null
  builds: RecipeBuildRow[]
  nutrition: NutritionRow[]
  recipeTags: { tag: { name: string } }[]
  usedInCount?: number
}

// A card shows the summary's first sentence so it ends on a full stop instead of an ellipsis
export const toCardSummary = (summary: string): string =>
  summary.match(/.*?[.!?](?=\s|$)/)?.[0].trim() ?? summary

const faceOf = (build: CardBuild): CardFace => ({
  title: build.title,
  summary: build.summary,
  imageUrl: build.imageUrl,
  totalMinutes: build.totalMinutes,
  costTier: build.costTier,
  difficulty: build.difficulty,
  course: build.course,
  tags: build.tags,
  calories: build.calories,
  carbsG: build.carbsG,
  fatG: build.fatG,
  proteinG: build.proteinG,
})

// The same card showing another of its builds
export const cardForBuild = (card: RecipeCard, build: CardBuild): RecipeCard => ({
  ...card,
  ...faceOf(build),
  build: { key: build.key, label: build.label, isDefault: build.isDefault },
})

export const cardHref = ({ slug, build }: RecipeCard): string =>
  buildHref(slug, build)

// A recipe with no build has no card
export const toRecipeCard = (row: RecipeCardRow): RecipeCard | undefined => {
  const fallbacks = {
    title: row.title,
    summary: row.summary,
    imageUrl: row.imageUrl ?? undefined,
    costTier: row.costTier,
    difficulty: row.difficulty,
    prepMinutes: row.prepMinutes,
    cookMinutes: row.cookMinutes,
    course: row.course,
    tags: row.recipeTags.map(({ tag }) => tag.name).sort(),
  }
  const builds = toRecipeBuilds(row.builds).map((build): CardBuild => {
    const resolved = resolveBuild(fallbacks, build)
    return {
      key: build.key,
      label: build.label,
      isDefault: build.isDefault,
      listed: build.listed,
      title: resolved.title,
      summary: toCardSummary(resolved.summary),
      imageUrl: resolved.imageUrl,
      totalMinutes: resolved.totalMinutes,
      costTier: resolved.costTier,
      difficulty: resolved.difficulty,
      course: resolved.course,
      tags: resolved.tags,
      calories: build.calories,
      carbsG: build.carbsG,
      fatG: build.fatG,
      proteinG: build.proteinG,
    }
  })
  const featured = defaultBuild(builds)
  if (!featured) return undefined
  const traditional = row.nutrition.find(({ kind }) => kind === 'traditional')

  return cardForBuild(
    {
      ...faceOf(featured),
      slug: row.slug,
      servings: row.servings,
      build: featured,
      builds,
      original: traditional && {
        proteinG: traditional.proteinG,
        carbsG: traditional.carbsG,
        fatG: traditional.fatG,
      },
      usedInCount: row.usedInCount ?? 0,
    },
    featured
  )
}
