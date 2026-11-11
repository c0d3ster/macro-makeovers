import type { RecipeImport } from '@/validations'

import { formatMacroRatios } from './macroRatios'

type Build = RecipeImport['builds'][number]
type Note = RecipeImport['notes'][number]
type Scope = { onlyBuilds?: string[]; skipBuilds?: string[] }

// The recipe book text that is not recipes: the intro, the "How to read the recipes" guide, and
// the closing sections. The intro lives in content/book and the rest in content/guides (shared
// with the site), so editing those files changes the book.
export type BookProse = {
  intro: string
  guide: string
  outro: string
}

export type BookRecipe = {
  recipe: RecipeImport
  // "10", or "10a" for a variant
  number: string
}

const NUMBER_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
]

const NOTE_HEADINGS: Partial<Record<Note['kind'], string>> = {
  make_or_break: 'Make-or-break',
  fixes: 'Fixes',
  levers: 'Levers',
}

// "Per serving" rows say what they were divided by, the way the book prints them
const DIVIDED_LABEL = /^per (?:serving|plate)$/i

// Book order: recipes the book already lists keep their place, anything newer follows A to Z.
// A variant sits right after its base and shares its number with a letter (10, 10a).
export const numberBookRecipes = (
  recipes: RecipeImport[],
  knownOrder: string[]
): BookRecipe[] => {
  const rank = (slug: string): number => {
    const index = knownOrder.indexOf(slug)
    return index === -1 ? Number.MAX_SAFE_INTEGER : index
  }
  const sorted = [...recipes].sort(
    (a, b) => rank(a.slug) - rank(b.slug) || a.title.localeCompare(b.title)
  )
  const bases = sorted.filter(({ variantOf }) => !variantOf)

  return bases.flatMap((base, index) => {
    const number = String(index + 1)
    const variants = sorted.filter(({ variantOf }) => variantOf === base.slug)
    return [
      { recipe: base, number },
      ...variants.map((recipe, variantIndex) => ({
        recipe,
        number: `${number}${String.fromCharCode(97 + variantIndex)}`,
      })),
    ]
  })
}

const anchorFor = ({ recipe, number }: BookRecipe): string =>
  `${number}-${recipe.slug}`

const featuredRow = ({ builds }: RecipeImport): Build => {
  const row = builds.find(({ isDefault }) => isDefault) ?? builds[0]
  if (!row) throw new Error('A recipe has no build')
  return row
}

// The book prints every line and step, and says which builds a scoped one is for:
// "(Beef grillers only)" or "(skip for Costco)"
const scopeLabel = (
  { builds }: RecipeImport,
  { onlyBuilds, skipBuilds }: Scope
): string => {
  const labels = (keys: string[]): string =>
    keys
      .map((key) => builds.find((build) => build.key === key)?.label ?? key)
      .join(' or ')
  if (onlyBuilds?.length) return ` _(${labels(onlyBuilds)} only)_`
  if (skipBuilds?.length) return ` _(skip for ${labels(skipBuilds)})_`
  return ''
}

const formatCalories = (calories: number): string =>
  `~${calories.toLocaleString('en-US')}`

// Pads every cell to its column width, the way Prettier lays out the hand-written tables
const toTable = (rows: string[][]): string => {
  const widths = (rows[0] ?? []).map((_, column) =>
    Math.max(...rows.map((row) => (row[column] ?? '').length), 3)
  )
  const line = (row: string[]): string =>
    `| ${row.map((cell, column) => cell.padEnd(widths[column] ?? 0)).join(' | ')} |`
  const [header = [], ...body] = rows
  const divider = `| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`
  return [line(header), divider, ...body.map(line)].join('\n')
}

const quickReference = (recipes: BookRecipe[]): string => {
  const rows = recipes.map((book) => {
    const row = featuredRow(book.recipe)
    return [
      `[${book.recipe.title}](#${anchorFor(book)})`,
      formatCalories(row.calories),
      `${row.proteinG}g`,
      formatMacroRatios(row),
      String(book.recipe.servings),
    ]
  })
  return [
    '## Quick reference',
    'Per serving, default/featured build for each. Full nutrition, other build options, and traditional comparisons are in each entry below.',
    `::: {.quickref}\n\n${toTable([['Recipe', 'Calories', 'Protein', 'Ratio C/F/P', 'Servings'], ...rows])}\n\n:::`,
  ].join('\n\n')
}

const nutritionTable = ({
  builds,
  nutrition,
  servings,
}: RecipeImport): string => {
  const rows = [...builds, ...nutrition].map((row) => {
    const traditional = 'kind' in row && row.kind === 'traditional'
    const label = DIVIDED_LABEL.test(row.label)
      ? `${row.label} (÷${servings})`
      : row.label
    const cells = [
      formatCalories(row.calories),
      `${row.carbsG}g`,
      `${row.fatG}g`,
      `${row.proteinG}g`,
      formatMacroRatios(row),
    ]
    return traditional
      ? [`_${label}_`, ...cells.map((cell) => `_${cell}_`)]
      : [`**${label}**`, ...cells]
  })
  return toTable([
    ['', 'Calories', 'Carbs', 'Fat', 'Protein', 'Ratio C/F/P'],
    ...rows,
  ])
}

// Imports strip the bold off tip labels, so "Chicken fat note: ..." gets its bold back
const toQuote = (body: string): string => {
  const bolded = body.replace(/^([^:.?\n*]{1,60}[:?])(\s)/, '**$1**$2')
  return bolded
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n')
}

// "Per sandwich — pick one" is a bold label with a trailing remark
const groupHeading = (group: string): string => {
  // The label ends where the first whitespace run before a dash or an opening paren starts
  const split = group.search(/\s+(?:—|\()/)
  return split > 0
    ? `**${group.slice(0, split)}**${group.slice(split)}`
    : `**${group}**`
}

const ingredientsSection = (recipe: RecipeImport): string => {
  const { ingredients, notes } = recipe
  // A group whose lines all carry the same scope says it once, on its heading
  const groupScope = (group: string | undefined): string => {
    if (!group) return ''
    const labels = ingredients
      .filter((ingredient) => ingredient.group === group)
      .map((ingredient) => scopeLabel(recipe, ingredient))
    const [first = ''] = labels
    return labels.every((label) => label === first) ? first : ''
  }
  const lines = ingredients.flatMap((ingredient, index) => {
    const previous = ingredients[index - 1]
    const shared = groupScope(ingredient.group)
    const heading =
      ingredient.group && ingredient.group !== previous?.group
        ? [
            `${index === 0 ? '' : '\n'}${groupHeading(ingredient.group)}${shared}\n`,
          ]
        : []
    const own = shared ? '' : scopeLabel(recipe, ingredient)
    return [...heading, `- ${ingredient.raw}${own}`]
  })
  const tips = notes
    .filter(({ kind }) => kind === 'tip')
    .map((note) => toQuote(`${note.body}${scopeLabel(recipe, note)}`))
  return ['### Ingredients', lines.join('\n'), ...tips].join('\n\n')
}

const timedMethod = (recipe: RecipeImport): string => {
  const block = (
    name: 'prep' | 'cook',
    label: string,
    minutes: number
  ): string[] => {
    const own = recipe.steps.filter((step) => step.phase === name)
    if (own.length === 0) return []
    const body = own
      .map((step, index) => {
        const body = `${step.body}${scopeLabel(recipe, step)}`
        return name === 'prep' ? `- ${body}` : `${index + 1}. ${body}`
      })
      .join('\n')
    return [`**${label}** (~${minutes} min)`, body]
  }
  return [
    '### Method',
    ...block('prep', 'Prep', recipe.prepMinutes),
    ...block('cook', 'Cook', recipe.cookMinutes),
  ].join('\n\n')
}

// The sections after the method, in the order the notes were stored: a heading with bullets,
// or a section of its own (toppings, an options table) that was kept whole as one lever.
const trailingSections = (recipe: RecipeImport): string[] => {
  const { notes } = recipe
  const sections: string[] = []
  let currentKind: Note['kind'] | undefined
  let bullets: string[] = []

  const flush = (): void => {
    const heading = currentKind && NOTE_HEADINGS[currentKind]
    if (heading && bullets.length > 0) {
      sections.push(`### ${heading}\n\n${bullets.join('\n')}`)
    }
    bullets = []
    currentKind = undefined
  }

  notes.forEach((note) => {
    const { kind, body } = note
    const scope = scopeLabel(recipe, note)
    const own = /^\*\*([^*\n]+)\*\*\n\n([\s\S]*)$/.exec(body)
    if (kind === 'levers' && own?.[1]) {
      flush()
      sections.push(`### ${own[1]}${scope}\n\n${own[2] ?? ''}`)
      return
    }
    if (!NOTE_HEADINGS[kind]) return
    if (kind !== currentKind) flush()
    currentKind = kind
    bullets.push(`- ${body}${scope}`)
  })
  flush()

  return sections
}

const recipeSection = (book: BookRecipe): string => {
  const { recipe, number } = book
  const stars = (count: number, mark: string): string => mark.repeat(count)
  const meta = [
    '$'.repeat(recipe.costTier),
    `~${recipe.prepMinutes + recipe.cookMinutes} min`,
    stars(recipe.difficulty, '●') + stars(5 - recipe.difficulty, '○'),
  ].join(' · ')
  const nutritionNotes = (kind: Note['kind']): string[] =>
    recipe.notes
      .filter((note) => note.kind === kind)
      .map((note) => `${note.body}${scopeLabel(recipe, note)}`)
  const intros = nutritionNotes('nutrition_intro')
  const analysis = nutritionNotes('nutrition_analysis')
  // What each build changes, under the table, named the way the build's page title reads
  const buildNotes = recipe.builds.flatMap(({ label, title, note }) =>
    note ? [`**${title ?? label}:** ${note}`] : []
  )

  return [
    `<a id="${anchorFor(book)}"></a>`,
    `## ${number}. ${recipe.title} | ${meta}`,
    `${recipe.summary} **Makes ~${recipe.servings} servings.**`,
    '### Nutrition',
    ...intros,
    nutritionTable(recipe),
    ...buildNotes,
    ...analysis,
    ingredientsSection(recipe),
    timedMethod(recipe),
    ...trailingSections(recipe),
  ].join('\n\n')
}

// The whole book as markdown, as the printable book's source, from recipes already numbered
// by numberBookRecipes. The quick reference table is generated from the same data.
export const renderBookMarkdown = (
  recipes: BookRecipe[],
  { intro, guide, outro }: BookProse
): string => {
  const baseCount = recipes.filter(({ recipe }) => !recipe.variantOf).length
  const countWord = NUMBER_WORDS[baseCount] ?? String(baseCount)
  const text = intro.replace(
    /All \w+ numbered recipes/,
    `All ${countWord} numbered recipes`
  )

  const sections = [
    text,
    quickReference(recipes),
    ...recipes.map((book) => `---\n\n${recipeSection(book)}`),
    `---\n\n${guide}`,
    `---\n\n${outro}`,
  ]

  return `${sections.join('\n\n')}\n`
}
