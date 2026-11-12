import type { CardBuild, RecipeCard } from '@/libs/recipes/recipeCards'

type CardFields = Omit<
  RecipeCard,
  'build' | 'builds' | 'course' | 'usedInCount'
> &
  Partial<Pick<RecipeCard, 'build' | 'builds' | 'course' | 'usedInCount'>>

// A card with one build that matches its face, so tests can set face fields directly. Pass
// builds to test a recipe with several.
export const withSingleBuild = (fields: CardFields): RecipeCard => {
  const course = fields.course ?? 'main'
  const build: CardBuild = {
    key: 'makeover',
    label: 'Per serving',
    isDefault: true,
    listed: true,
    title: fields.title,
    summary: fields.summary,
    imageUrl: fields.imageUrl,
    totalMinutes: fields.totalMinutes,
    costTier: fields.costTier,
    difficulty: fields.difficulty,
    course,
    tags: fields.tags,
    calories: fields.calories,
    carbsG: fields.carbsG,
    fatG: fields.fatG,
    proteinG: fields.proteinG,
  }
  return {
    build: { key: build.key, label: build.label, isDefault: true },
    builds: [build],
    usedInCount: 0,
    ...fields,
    course,
  }
}
