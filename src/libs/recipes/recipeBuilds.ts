// Builds are versions of one recipe that share its method. Each has its own macros and can
// override a few recipe fields. Ingredients, steps, and notes can be scoped to some builds.
// Everything here is pure, so the page, the grid, the book, and the basket read a build the
// same way.

// Which builds a row belongs to. Both missing means every build, and only one is ever set.
export type BuildScope = {
  onlyBuilds?: string[]
  skipBuilds?: string[]
}

export type MacroValues = {
  calories: number
  carbsG: number
  fatG: number
  proteinG: number
}

export type RecipeBuild = MacroValues & {
  key: string
  // The nutrition table row
  label: string
  isDefault: boolean
  // False for components like "Filling only": selectable on the page, never leads a card
  listed: boolean
  title?: string
  summary?: string
  // One or two lines on what changes, shown under the table while selected
  note?: string
  costTier?: number
  difficulty?: number
  prepMinutes?: number
  cookMinutes?: number
  tagsAdd: string[]
  tagsRemove: string[]
  imageUrl?: string
}

// The recipe-level values a build falls back to
export type BuildFallbacks = {
  title: string
  summary: string
  imageUrl?: string
  costTier: number
  difficulty: number
  prepMinutes: number
  cookMinutes: number
  tags: string[]
}

export type ResolvedBuild = BuildFallbacks & {
  build: RecipeBuild
  totalMinutes: number
}

// Whether a scoped row shows for a build
export const appliesToBuild = (
  { onlyBuilds, skipBuilds }: BuildScope,
  key: string
): boolean =>
  onlyBuilds?.length
    ? onlyBuilds.includes(key)
    : !(skipBuilds ?? []).includes(key)

export const scopeToBuild = <T extends BuildScope>(
  rows: T[],
  key: string
): T[] => rows.filter((row) => appliesToBuild(row, key))

// A row only some builds see, so the page can mark it
export const isScoped = ({ onlyBuilds, skipBuilds }: BuildScope): boolean =>
  Boolean(onlyBuilds?.length || skipBuilds?.length)

// The flagged default, else the first build
export const defaultBuild = <T extends Pick<RecipeBuild, 'isDefault'>>(
  builds: T[]
): T | undefined => builds.find(({ isDefault }) => isDefault) ?? builds[0]

// The build a key names, else the default. A hand-edited link with an unknown key still works.
export const findBuild = <T extends Pick<RecipeBuild, 'isDefault' | 'key'>>(
  builds: T[],
  key: string | null | undefined
): T | undefined =>
  (key ? builds.find((build) => build.key === key) : undefined) ??
  defaultBuild(builds)

// The recipe's tags minus what the build drops, plus what it adds, A to Z
export const buildTags = (
  tags: string[],
  { tagsAdd, tagsRemove }: Pick<RecipeBuild, 'tagsAdd' | 'tagsRemove'>
): string[] =>
  [
    ...new Set([...tags.filter((tag) => !tagsRemove.includes(tag)), ...tagsAdd]),
  ].sort()

export const resolveBuild = (
  recipe: BuildFallbacks,
  build: RecipeBuild
): ResolvedBuild => {
  const prepMinutes = build.prepMinutes ?? recipe.prepMinutes
  const cookMinutes = build.cookMinutes ?? recipe.cookMinutes

  return {
    build,
    title: build.title ?? recipe.title,
    summary: build.summary ?? recipe.summary,
    imageUrl: build.imageUrl ?? recipe.imageUrl,
    costTier: build.costTier ?? recipe.costTier,
    difficulty: build.difficulty ?? recipe.difficulty,
    prepMinutes,
    cookMinutes,
    totalMinutes: prepMinutes + cookMinutes,
    tags: buildTags(recipe.tags, build),
  }
}

// The recipe page link for a build. The default build has no param, so its link stays canonical.
export const buildHref = (
  slug: string,
  build: Pick<RecipeBuild, 'isDefault' | 'key'> | undefined
): string =>
  build && !build.isDefault
    ? `/recipes/${slug}?build=${encodeURIComponent(build.key)}`
    : `/recipes/${slug}`
