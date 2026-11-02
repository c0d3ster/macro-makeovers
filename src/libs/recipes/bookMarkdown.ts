import type { RecipeImport } from '@/validations'

import { formatMacroRatios } from './macroRatios'

type Nutrition = RecipeImport['nutrition'][number]
type Note = RecipeImport['notes'][number]

// The recipe book text that is not recipes: the intro, the "How to read the recipes" guide, and
// the closing sections. It is cut out of docs/recipes.md, so editing the prose there changes the
// book.
export type BookProse = {
  intro: string
  guide: string
  outro: string
}

type BookRecipe = {
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

// Pieces of docs/recipes.md that stay hand-written. The generated parts sit between them.
export const splitBookProse = (markdown: string): BookProse => {
  const quickStart = markdown.indexOf('\n## Quick reference')
  const guideStart = markdown.indexOf('\n## How to read the recipes')
  const outroStart = markdown.indexOf('\n## Second Helpings')
  if (quickStart === -1 || guideStart === -1 || outroStart === -1) {
    throw new Error(
      'docs/recipes.md needs "Quick reference", "How to read the recipes", and "Second Helpings" sections'
    )
  }
  const guideEnd = markdown.indexOf('\n---\n', guideStart)

  return {
    intro: markdown.slice(0, quickStart).trim(),
    guide: markdown.slice(guideStart, guideEnd).trim(),
    outro: markdown.slice(outroStart).trim(),
  }
}

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

const featuredRow = ({ nutrition }: RecipeImport): Nutrition => {
  const row = nutrition.find(({ isDefault }) => isDefault) ?? nutrition[0]
  if (!row) throw new Error('A recipe has no nutrition row')
  return row
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

const nutritionTable = ({ nutrition, servings }: RecipeImport): string => {
  const rows = nutrition.map((row) => {
    const traditional = row.kind === 'traditional'
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

const ingredientsSection = ({ ingredients, notes }: RecipeImport): string => {
  const lines = ingredients.flatMap((ingredient, index) => {
    const previous = ingredients[index - 1]
    const heading =
      ingredient.group && ingredient.group !== previous?.group
        ? [`${index === 0 ? '' : '\n'}${groupHeading(ingredient.group)}\n`]
        : []
    return [...heading, `- ${ingredient.raw}`]
  })
  const tips = notes
    .filter(({ kind }) => kind === 'tip')
    .map(({ body }) => toQuote(body))
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
      .map((step, index) =>
        name === 'prep' ? `- ${step.body}` : `${index + 1}. ${step.body}`
      )
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
const trailingSections = ({ notes }: RecipeImport): string[] => {
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

  notes.forEach(({ kind, body }) => {
    const own = /^\*\*([^*\n]+)\*\*\n\n([\s\S]*)$/.exec(body)
    if (kind === 'levers' && own?.[1]) {
      flush()
      sections.push(`### ${own[1]}\n\n${own[2] ?? ''}`)
      return
    }
    if (!NOTE_HEADINGS[kind]) return
    if (kind !== currentKind) flush()
    currentKind = kind
    bullets.push(`- ${body}`)
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
  const intros = recipe.notes
    .filter(({ kind }) => kind === 'nutrition_intro')
    .map(({ body }) => body)
  const analysis = recipe.notes
    .filter(({ kind }) => kind === 'nutrition_analysis')
    .map(({ body }) => body)

  return [
    `<a id="${anchorFor(book)}"></a>`,
    `## ${number}. ${recipe.title} | ${meta}`,
    `${recipe.summary} **Makes ~${recipe.servings} servings.**`,
    '### Nutrition',
    ...intros,
    nutritionTable(recipe),
    ...analysis,
    ingredientsSection(recipe),
    timedMethod(recipe),
    ...trailingSections(recipe),
  ].join('\n\n')
}

// The whole book as markdown, in the shape of docs/recipes.md, from recipes already numbered
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
