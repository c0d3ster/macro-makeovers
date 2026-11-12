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
  // Tags this build trades, like { turkey: 'beef' }. The title's and summary's words swap too.
  swap: Record<string, string>
  // Only when the swapped title is not the wording wanted, like "Lean Beef Taco Grillers"
  title?: string
  // One or two lines on what changes, shown under the table while selected
  note?: string
  costTier?: number
  difficulty?: number
  prepMinutes?: number
  cookMinutes?: number
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

// The recipe's tags with each swapped one traded for its replacement, A to Z
export const buildTags = (
  tags: string[],
  { swap }: Pick<RecipeBuild, 'swap'>
): string[] => [...new Set(tags.map((tag) => swap[tag] ?? tag))].sort()

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// "beef" takes the casing of the word it replaces: "Turkey" becomes "Beef", "TURKEY" "BEEF"
const matchCase = (word: string, replacement: string): string => {
  if (word === word.toUpperCase()) return replacement.toUpperCase()
  if (word.charAt(0) === word.charAt(0).toUpperCase()) {
    return replacement.replace(/\b\w/g, (letter) => letter.toUpperCase())
  }
  return replacement
}

// Text with each swapped tag's word replaced, whole words only
const swapWords = (text: string, swap: Record<string, string>): string =>
  Object.entries(swap).reduce(
    (swapped, [from, to]) => {
      const pattern = new RegExp(`\\b${escapeRegExp(from)}\\b`, 'gi')
      return swapped.replace(pattern, (word) => matchCase(word, to))
    },
    text
  )

// The title for a build: its own when set, else the recipe title with each swapped tag's word
// replaced, so "Turkey Taco Grillers" reads "Beef Taco Grillers"
export const buildTitle = (
  title: string,
  build: Pick<RecipeBuild, 'swap' | 'title'>
): string => build.title ?? swapWords(title, build.swap)

// The summary for a build, with each swapped tag's word replaced the same way as the title
export const buildSummary = (
  summary: string,
  { swap }: Pick<RecipeBuild, 'swap'>
): string => swapWords(summary, swap)

export const resolveBuild = (
  recipe: BuildFallbacks,
  build: RecipeBuild
): ResolvedBuild => {
  const prepMinutes = build.prepMinutes ?? recipe.prepMinutes
  const cookMinutes = build.cookMinutes ?? recipe.cookMinutes

  return {
    build,
    title: buildTitle(recipe.title, build),
    summary: buildSummary(recipe.summary, build),
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
