import type { RecipeImport } from '@/validations'

export type FieldChange = {
  // Dotted path with array indexes, e.g. `ingredients[2].raw`
  path: string
  before: unknown
  after: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const diffValues = (
  before: unknown,
  after: unknown,
  path: string,
  changes: FieldChange[]
): void => {
  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length)
    Array.from({ length }, (_, index) =>
      diffValues(before[index], after[index], `${path}[${index}]`, changes)    )
    return
  }

  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    keys.forEach((key) =>
      diffValues(
        before[key],
        after[key],
        path ? `${path}.${key}` : key,
        changes
      )
    )
    return
  }

  if (before !== after) changes.push({ path, before, after })
}

// Tags are a set, so a new tag is one addition and not a shift of everything after it
const diffTags = (before: string[], after: string[]): FieldChange[] => [
  ...after
    .filter((tag) => !before.includes(tag))
    .map((tag) => ({ path: 'tags[+]', before: undefined, after: tag })),
  ...before
    .filter((tag) => !after.includes(tag))
    .map((tag) => ({ path: 'tags[-]', before: tag, after: undefined })),
]

// Field-level differences between the stored recipe and an incoming import.
// Both sides come through the same schema, so defaults are filled in the same way.
export const diffRecipes = (
  before: RecipeImport,
  after: RecipeImport
): FieldChange[] => {
  const { tags: beforeTags, ...beforeRest } = before
  const { tags: afterTags, ...afterRest } = after

  const changes: FieldChange[] = []
  diffValues(beforeRest, afterRest, '', changes)
  return [...changes, ...diffTags(beforeTags, afterTags)]
}
