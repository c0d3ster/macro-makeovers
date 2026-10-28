import type { RecipeImportInput } from '@/validations'

type Nutrition = RecipeImportInput['nutrition'][number]
type Ingredient = RecipeImportInput['ingredients'][number]
type Step = RecipeImportInput['steps'][number]
type Note = RecipeImportInput['notes'][number]

type QuickRef = {
  title: string
  calories: number
  protein: number
  servings: number
}

// A parsed recipe before tags are added (tags are a judgment call, not in the book)
type ParsedRecipe = Omit<RecipeImportInput, 'tags'>

const SKIPPED_NUTRITION_ROWS = /^(?:whole batch|per slider)/i
const NOTE_SECTIONS: Record<string, Note['kind']> = {
  'make-or-break': 'make_or_break',
  fixes: 'fixes',
  levers: 'levers',
}

const slugify = (title: string): string =>
  title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const stripBold = (text: string): string => text.replace(/\*\*/g, '').trim()

const tableCells = (line: string): string[] =>
  line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim())

const cleanCell = (cell: string): string => cell.replace(/^[*_]+|[*_]+$/g, '')

const toNumber = (cell: string): number =>
  Number(cleanCell(cell).replace(/[~g,]/g, ''))

const firstInteger = (text: string, label: string): number => {
  const match = /(\d+)/.exec(text)
  if (!match?.[1]) throw new Error(`No number found in ${label}: "${text}"`)
  return Number(match[1])
}

const parseQuickReference = (lines: string[]): QuickRef[] =>
  lines.flatMap((line) => {
    const match = /^\| \[([^\]]+)\]\([^)]*\)/.exec(line)
    if (!match?.[1]) return []
    const cells = tableCells(line)
    return [
      {
        title: match[1],
        calories: toNumber(cells[1] ?? ''),
        protein: toNumber(cells[2] ?? ''),
        servings: Number(cells[4]),
      },
    ]
  })

const splitSections = (lines: string[]): Map<string, string[]> => {
  const sections = new Map<string, string[]>()
  let current = '_intro'
  sections.set(current, [])
  lines.forEach((line) => {
    const heading = /^### (.+)$/.exec(line)
    if (heading?.[1]) {
      current = heading[1].trim()
      sections.set(current, [])
      return
    }
    sections.get(current)?.push(line)
  })
  return sections
}

const sectionByPrefix = (
  sections: Map<string, string[]>,
  prefix: string
): string[] => {
  const key = [...sections.keys()].find((name) =>
    name.toLowerCase().startsWith(prefix)
  )
  return (key && sections.get(key)) || []
}

const parseNutrition = (
  lines: string[],
  quick: QuickRef,
  title: string
): Nutrition[] => {
  const rows = lines
    .filter((line) => line.startsWith('|'))
    .map(tableCells)
    .filter((cells) => /\d/.test(cells[1] ?? ''))
    .filter((cells) => !SKIPPED_NUTRITION_ROWS.test(stripBold(cells[0] ?? '')))

  const parsed = rows.map((cells) => {
    const label = cleanCell(stripBold(cells[0] ?? ''))
      .replace(/\s*\([÷×]\d+\)$/, '')
      .trim()
    const traditional = /^traditional/i.test(label)
    return {
      kind: traditional ? 'traditional' : 'makeover',
      label,
      calories: toNumber(cells[1] ?? ''),
      carbsG: toNumber(cells[2] ?? ''),
      fatG: toNumber(cells[3] ?? ''),
      proteinG: toNumber(cells[4] ?? ''),
      isDefault: false,
    } satisfies Nutrition
  })

  // The featured build is the one the quick reference table lists
  const matches = parsed.filter(
    (row) =>
      row.kind === 'makeover' &&
      row.calories === quick.calories &&
      row.proteinG === quick.protein
  )
  if (matches.length !== 1) {
    throw new Error(
      `${title}: expected exactly one makeover row matching the quick reference ` +
        `(${quick.calories} cal, ${quick.protein}g protein), found ${matches.length}`
    )
  }

  return parsed.map((row) => ({ ...row, isDefault: row === matches[0] }))
}

const parseIngredients = (
  lines: string[]
): { ingredients: Ingredient[]; tips: Note[] } => {
  const ingredients: Ingredient[] = []
  const tips: Note[] = []
  let group: string | undefined
  let quote: string[] = []

  const flushQuote = (): void => {
    const body = quote.join('\n').trim()
    if (body) tips.push({ kind: 'tip', body: stripBold(body) })
    quote = []
  }

  lines.forEach((line) => {
    if (line.startsWith('>')) {
      quote.push(line.replace(/^>\s?/, ''))
      return
    }
    flushQuote()

    const bullet = /^- (.+)$/.exec(line)
    if (bullet?.[1]) {
      ingredients.push({
        ...(group ? { group } : {}),
        raw: stripBold(bullet[1]),
      })
      return
    }

    // A bold label alone, or followed by a note: `**Salad** (makes 4)`, `**Per sandwich** — pick one`
    const heading = /^\*\*[^*]+\*\*(?:\s*(?:\(.*\)|[—-].*))?$/.exec(line.trim())
    if (heading) {
      group = stripBold(line)
      return
    }

    // Wrapped continuation of the previous bullet
    if (/^\s+\S/.test(line) && ingredients.length > 0) {
      const last = ingredients.at(-1)
      if (last) last.raw = `${last.raw} ${stripBold(line)}`
      return
    }

    if (line.trim()) tips.push({ kind: 'tip', body: stripBold(line) })
  })
  flushQuote()

  return { ingredients, tips }
}

const parseMethod = (
  lines: string[]
): { steps: Step[]; prepMinutes: number; cookMinutes: number } => {
  const steps: Step[] = []
  let phase: Step['phase'] | undefined
  let prepMinutes = 0
  let cookMinutes = 0
  let current: string[] | undefined

  const flush = (): void => {
    const body = current?.join('\n').trim()
    if (phase && body) steps.push({ phase, body })
    current = undefined
  }

  lines.forEach((line) => {
    const header = /^\*\*(Prep|Cook)\*\*(.*)$/.exec(line.trim())
    if (header?.[1]) {
      flush()
      phase = header[1] === 'Prep' ? 'prep' : 'cook'
      const minutes = firstInteger(header[2] ?? '', `${header[1]} time`)
      if (phase === 'prep') prepMinutes = minutes
      else cookMinutes = minutes
      return
    }
    if (!phase) return

    if (phase === 'prep') {
      const bullet = /^- (.+)$/.exec(line)
      if (bullet?.[1]) {
        flush()
        current = [bullet[1]]
      } else if (line.trim() && current) {
        current.push(line.trim())
      }
      return
    }

    const numbered = /^\d+\. (.+)$/.exec(line)
    if (numbered?.[1]) {
      flush()
      current = [numbered[1]]
    } else if (current) {
      // Sub-sections inside a step (e.g. one build per bullet list) stay with that step
      current.push(line)
    }
  })
  flush()

  if (steps.length === 0) throw new Error('No method steps found')
  return { steps, prepMinutes, cookMinutes }
}

const parseBullets = (lines: string[], kind: Note['kind']): Note[] =>
  lines.reduce<Note[]>((notes, line) => {
    const bullet = /^- (.+)$/.exec(line)
    if (bullet?.[1]) return [...notes, { kind, body: bullet[1].trim() }]

    const last = notes.at(-1)
    if (line.trim() && last) {
      return [
        ...notes.slice(0, -1),
        { ...last, body: `${last.body} ${line.trim()}` },
      ]
    }
    return notes
  }, [])

const parseRecipe = (
  heading: string,
  body: string[],
  quick: QuickRef
): ParsedRecipe => {
  const [titlePart = '', meta = ''] = heading.split(' | ')
  const title = quick.title || stripBold(titlePart)
  const sections = splitSections(body)
  const intro = (sections.get('_intro') ?? []).join('\n').trim()
  const summary = stripBold(intro.split(/\n\s*\n/)[0] ?? '').replace(/\n/g, ' ')

  const { ingredients, tips } = parseIngredients(
    sectionByPrefix(sections, 'ingredients')
  )
  const method = parseMethod(sectionByPrefix(sections, 'method'))

  const notes: Note[] = [...tips]
  sections.forEach((lines, name) => {
    const key = name.toLowerCase()
    const kind = NOTE_SECTIONS[key]
    if (kind) {
      notes.push(...parseBullets(lines, kind))
      return
    }
    const handled = ['_intro', 'nutrition', 'ingredients', 'method'].some(
      (prefix) => key.startsWith(prefix)
    )
    if (handled) return

    // Everything else (toppings, options tables, a side recipe) is a lever to adjust the dish
    const content = lines
      .join('\n')
      .replace(/\n---\s*$/, '')
      .trim()
    if (content)
      notes.push({ kind: 'levers', body: `**${name}**\n\n${content}` })
  })

  return {
    slug: slugify(title),
    title,
    summary,
    servings: quick.servings,
    prepMinutes: method.prepMinutes,
    cookMinutes: method.cookMinutes,
    costTier: (meta.match(/\$/g) ?? []).length,
    difficulty: (meta.match(/●/g) ?? []).length,
    nutrition: parseNutrition(
      sectionByPrefix(sections, 'nutrition'),
      quick,
      title
    ),
    ingredients,
    steps: method.steps,
    notes,
  }
}

// Reads the recipe book (docs/recipes.md) into the import shape. The quick reference table
// supplies servings and picks each recipe's default nutrition row, which doubles as a check
// that the table and the per-recipe tables agree.
export const parseRecipesMarkdown = (markdown: string): ParsedRecipe[] => {
  const lines = markdown.split('\n')
  const quickRefs = parseQuickReference(lines)

  const starts = lines.flatMap((line, index) =>
    /^## \d+\. /.test(line) ? [index] : []
  )
  if (starts.length === 0) throw new Error('No numbered recipes found')
  if (starts.length !== quickRefs.length) {
    throw new Error(
      `Quick reference lists ${quickRefs.length} recipes but the book has ${starts.length}`
    )
  }

  return starts.map((start, index) => {
    const nextStart = starts[index + 1] ?? lines.length
    const end = lines.findIndex(
      (line, lineIndex) => lineIndex > start && /^(?:## |---$)/.test(line)
    )
    const stop = end === -1 ? nextStart : Math.min(end, nextStart)
    const heading = (lines[start] ?? '').replace(/^## \d+\.\s+/, '')
    const quick = quickRefs[index]
    if (!quick) throw new Error(`No quick reference row for "${heading}"`)
    return parseRecipe(heading, lines.slice(start + 1, stop), quick)
  })
}
