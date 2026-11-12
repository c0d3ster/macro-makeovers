import type { RecipeImport } from '@/validations'

export type FieldChange = {
  // Dotted path with array indexes, e.g. `ingredients[2].raw`. A changed or added row uses its
  // new index, and a removed row uses its old one.
  path: string
  before: unknown
  after: unknown
}

type Row = Record<string, unknown>

// The recipe lists diffed row by row. Builds are matched by key, the rest by their content.
const ROW_LISTS = [
  'builds',
  'nutrition',
  'ingredients',
  'steps',
  'notes',
  'components',
] as const
type RowList = (typeof ROW_LISTS)[number]

// The text that names a row, so an edited row pairs with its old self instead of reading as a
// removal and an addition. Builds also carry a label, which survives a key rename.
const ROW_TEXT = ['label', 'raw', 'body', 'key', 'slug'] as const

// Below this share of words in common, two rows are different rows
const MIN_SIMILARITY = 0.3

const isRecord = (value: unknown): value is Row =>
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

// Key order can differ between the stored and the incoming side, so it is sorted away
const stableJson = (value: unknown): string =>
  JSON.stringify(value, (_, inner: unknown) =>
    isRecord(inner)
      ? Object.fromEntries(
          Object.entries(inner).sort(([a], [b]) => a.localeCompare(b))
        )
      : inner  )

const words = (row: Row | undefined): Set<string> => {
  const field = ROW_TEXT.find((name) => typeof row?.[name] === 'string')
  const text = field && row ? String(row[field]) : ''
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
}

// Share of words two rows have in common, from 0 to 1
const similarity = (a: Row | undefined, b: Row | undefined): number => {
  const left = words(a)
  const right = words(b)
  const shared = [...left].filter((word) => right.has(word)).length
  const total = new Set([...left, ...right]).size
  return total === 0 ? 0 : shared / total
}

// Index pairs of the longest run of rows both lists share, in order
const commonRows = (before: string[], after: string[]): [number, number][] => {
  // table[i][j] is the longest shared run from before[i] and after[j] on. Each row is its own
  // array, built in a loop, since filling with one array would share it across every row.
  const table: number[][] = []
  for (let i = 0; i <= before.length; i += 1) {
    const row: number[] = []
    for (let j = 0; j <= after.length; j += 1) row.push(0)
    table.push(row)
  }
  for (let i = before.length - 1; i >= 0; i -= 1) {
    for (let j = after.length - 1; j >= 0; j -= 1) {
      const row: number[] = table[i] ?? []
      row[j] =
        before[i] === after[j]
          ? (table[i + 1]?.[j + 1] ?? 0) + 1
          : Math.max(table[i + 1]?.[j] ?? 0, row[j + 1] ?? 0)
    }
  }

  const pairs: [number, number][] = []
  let i = 0
  let j = 0
  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) {
      pairs.push([i, j])
      i += 1
      j += 1
    } else if ((table[i + 1]?.[j] ?? 0) >= (table[i]?.[j + 1] ?? 0)) {
      i += 1
    } else {
      j += 1
    }
  }
  return pairs
}

// Rows are lined up by what they say, not where they sit, so one inserted step is one addition
// rather than a change to every step after it. Rows that stay in order are matched first. A
// row found elsewhere is a move. Between matches, an edited row pairs with the most alike old
// row in the same gap, and the rest are additions and removals.
const diffRows = (
  name: RowList,
  before: Row[],
  after: Row[],
  identity: (row: Row) => string
): FieldChange[] => {
  const changes: FieldChange[] = []
  const at = (index: number): string => `${name}[${index}]`
  const beforeIds = before.map(identity)
  const afterIds = after.map(identity)
  const anchors = commonRows(beforeIds, afterIds)

  anchors.forEach(([i, j]) => diffValues(before[i], after[j], at(j), changes))

  const matchedBefore = new Set(anchors.map(([i]) => i))
  const matchedAfter = new Set(anchors.map(([, j]) => j))

  // Out of order rows: the same row on both sides, outside the in-order run
  afterIds.forEach((id, j) => {
    if (matchedAfter.has(j)) return
    const i = beforeIds.findIndex(
      (other, index) => other === id && !matchedBefore.has(index)
    )
    if (i === -1) return
    matchedBefore.add(i)
    matchedAfter.add(j)
    changes.push({ path: `${at(j)}.position`, before: i, after: j })
    diffValues(before[i], after[j], at(j), changes)
  })

  // The unmatched rows between each pair of anchors
  const bounds: [number, number][] = [
    [-1, -1],
    ...anchors,
    [before.length, after.length],
  ]
  bounds.slice(1).forEach(([endI, endJ], index) => {
    const [startI, startJ] = bounds[index] ?? [-1, -1]
    const range = (from: number, to: number, taken: Set<number>): number[] =>
      Array.from(
        { length: Math.max(0, to - from - 1) },
        (_, k) => from + 1 + k
      ).filter((k) => !taken.has(k))
    const removed = range(startI, endI, matchedBefore)
    const added = range(startJ, endJ, matchedAfter)

    // The most alike rows pair first, so an edited row finds the row it replaced
    const candidates = removed
      .flatMap((i) =>
        added.map((j) => ({ i, j, score: similarity(before[i], after[j]) }))
      )
      .filter(({ score }) => score >= MIN_SIMILARITY)
      .sort((a, b) => b.score - a.score || a.j - b.j)
    candidates.forEach(({ i, j }) => {
      if (!removed.includes(i) || !added.includes(j)) return
      removed.splice(removed.indexOf(i), 1)
      added.splice(added.indexOf(j), 1)
      diffValues(before[i], after[j], at(j), changes)
    })
    added.forEach((j) =>
      changes.push({ path: at(j), before: undefined, after: after[j] })
    )
    removed.forEach((i) =>
      changes.push({ path: at(i), before: before[i], after: undefined })
    )
  })

  // Top to bottom, the way the recipe reads. Sort is stable, so a row's fields keep their order.
  const indexOf = ({ path }: FieldChange): number =>
    Number(/^[a-z]+\[(\d+)\]/.exec(path)?.[1] ?? 0)
  return changes.sort((a, b) => indexOf(a) - indexOf(b))
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

const pickRows = (recipe: RecipeImport, name: RowList): Row[] =>
  recipe[name] as unknown as Row[]

// The recipe's own fields, without the lists diffed on their own
const scalarFields = (recipe: RecipeImport): Row =>
  Object.fromEntries(
    Object.entries(recipe).filter(
      ([name]) =>
        name !== 'tags' && !(ROW_LISTS as readonly string[]).includes(name)
    )
  )

// Field-level differences between the stored recipe and an incoming import.
// Both sides come through the same schema, so defaults are filled in the same way.
export const diffRecipes = (
  before: RecipeImport,
  after: RecipeImport
): FieldChange[] => {
  const changes: FieldChange[] = []
  diffValues(scalarFields(before), scalarFields(after), '', changes)
  ROW_LISTS.forEach((name) =>
    changes.push(
      ...diffRows(
        name,
        pickRows(before, name),
        pickRows(after, name),
        name === 'builds' ? (row) => String(row.key) : stableJson
      )
    )
  )
  return [...changes, ...diffTags(before.tags, after.tags)]
}
