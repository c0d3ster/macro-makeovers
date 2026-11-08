import 'reflect-metadata'
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { BookRecipe } from '@/libs/recipes'
import type { RecipeImport } from '@/validations'

import { closeDb } from '@/libs/DB'
import { renderBookMarkdown, toMacroRatios } from '@/libs/recipes'

import { photoKeyFor, RECIPE_HEADING } from './bookPhotos'
import {
  loadBookPhotoUrls,
  loadBookProse,
  loadBookRecipes,
} from './bookSource'

// Builds the printable recipe book (build/macro-makeovers.pdf) from the published recipes in the
// database (or `--from <folder>` of recipe JSON), the prose in content/book and
// content/guides, and the photos from
// R2 (R2_PUBLIC_URL). Needs pandoc on the PATH. Run with `pnpm book:pdf`.
const ROOT = process.cwd()
const PHOTO_DIR = resolve(ROOT, 'build/photos')
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL
const OUTPUT_DIR = resolve(ROOT, 'build')
const HTML_PATH = resolve(OUTPUT_DIR, 'macro-makeovers.html')
const PDF_PATH = resolve(OUTPUT_DIR, 'macro-makeovers.pdf')

const STYLES = `
  @page { size: Letter; margin: 0.5in; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 10pt; line-height: 1.4; color: #222; margin: 0; }
  h1 { font-size: 26pt; margin: 0 0 0.1in; padding-bottom: 6pt; border-bottom: 2px solid #222; }
  h2 { font-size: 15pt; margin: 0.3in 0 0.1in; padding-bottom: 4pt; border-bottom: 1px solid #999; }
  h3 { font-size: 11pt; margin: 0.2in 0 0.06in; color: #444; }
  h4 { font-size: 10pt; margin: 0.14in 0 0.04in; }
  h2, h3, h4, p:has(> strong:only-child) { break-after: avoid; }
  p { margin: 0 0 0.08in; }
  a { color: #2a5a9a; text-decoration: none; }
  ul, ol { margin: 0 0 0.1in; padding-left: 0.3in; }
  li { margin-bottom: 2pt; }
  .ingredients { column-count: 2; column-gap: 0.3in; }
  .ingredients li { break-inside: avoid; }
  .ingredients ul { margin-bottom: 0.06in; }
  .nutrition table { margin: 0.04in 0 0.08in; }
  .nutrition th, .nutrition td { padding: 2.5pt 7pt; }
  table { width: 100%; border-collapse: collapse; margin: 0.08in 0 0.12in; font-size: 9pt; break-inside: avoid; }
  th, td { border: 1px solid #bbb; padding: 4pt 7pt; text-align: left; }
  th { background: #eee; }
  blockquote { margin: 0.1in 0; padding: 6pt 10pt; background: #f5f5ef; border-left: 3px solid #888; font-size: 9pt; break-inside: avoid; }
  blockquote p:last-child { margin-bottom: 0; }
  hr { display: none; }
  .recipe-start, #how-to-read-the-recipes { break-before: page; }
  h2.recipe-start { display: flex; justify-content: space-between; align-items: center; gap: 12pt; margin-top: 0; }
  .pill { flex: none; font-size: 9pt; font-weight: normal; padding: 4pt 10pt; border-radius: 12pt; background: #efeedd; border: 1px solid #d8d6bc; color: #444; }
  .hero { display: flex; gap: 0.25in; align-items: stretch; margin: 0.1in 0 0.14in; break-inside: avoid; }
  .hero-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 9pt; }
  .hero-text p { margin: 0; }
  .photo { flex: none; width: 3.1in; min-height: 2.4in; object-fit: cover; border-radius: 6pt; display: block; }
  .stats { margin-top: auto; }
  .headline { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6pt; }
  .headline b { font-size: 20pt; line-height: 1; margin-right: 4pt; }
  .headline .servings b { font-size: 15pt; }
  .headline span { color: #666; font-size: 10pt; }
  .macros { display: flex; gap: 6pt; }
  .macro { min-width: 0.8in; text-align: center; padding: 6pt 4pt; border-radius: 6pt; border: 1px solid #c9c9c9; line-height: 1.2; }
  .macro b { display: block; font-size: 15pt; }
  .macro span { display: block; color: #555; font-size: 9pt; }
  .macro small { color: #666; font-size: 8pt; }
  .macro.carbs { background: rgb(117 132 205 / 0.35); }
  .macro.fat { background: rgb(214 168 82 / 0.35); }
  .macro.protein { background: rgb(112 164 124 / 0.35); }
  .original { display: flex; gap: 6pt; height: 4pt; margin-top: 5pt; opacity: 0.25; }
  .original div { min-width: 0.8in; border-radius: 4pt; }
  .original .carbs { background: rgb(117 132 205); }
  .original .fat { background: rgb(214 168 82); }
  .original .protein { background: rgb(112 164 124); }
  .quickref { break-inside: avoid; }
  .quickref table { margin-top: 0.04in; }
  .quickref td, .quickref th { padding: 3pt 7pt; white-space: nowrap; }
  .quickref td:first-child { width: 52%; white-space: normal; }
`

// Downloads each recipe's photo into build/photos, keyed by its number in the book. That is the
// photo chosen in the editor, else the one at the recipe's standard R2 address. A recipe whose
// photo cannot be fetched is left without one.
const downloadPhotos = async (
  recipes: BookRecipe[],
  chosenUrls: Map<string, string>
): Promise<Map<string, string>> => {
  const photos = new Map<string, string>()
  if (!R2_PUBLIC_URL) {
    console.warn('R2_PUBLIC_URL is not set, so the book has no photos')
    return photos
  }

  mkdirSync(PHOTO_DIR, { recursive: true })
  for (const { number, recipe } of recipes) {
    const url =
      chosenUrls.get(recipe.slug) ??
      `${R2_PUBLIC_URL.replace(/\/+$/, '')}/${photoKeyFor(recipe.slug)}`
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`No photo for recipe ${number} (${response.status} ${url})`)
      continue
    }
    const file = resolve(PHOTO_DIR, `${recipe.slug}.jpg`)
    writeFileSync(file, new Uint8Array(await response.arrayBuffer()))
    photos.set(number, file)
  }
  return photos
}

// The photo goes in as a marker image right under each recipe heading, before pandoc runs.
// layoutRecipes() later puts the stats block under it.
const addPhotos = (markdown: string, photos: Map<string, string>): string =>
  markdown.replace(RECIPE_HEADING, (heading, number: string) => {
    const image = photos.get(number)
    if (!image) return heading
    return `${heading}

<img class="photo" src="${pathToFileURL(image).href}" alt="">`
  })

type Row = RecipeImport['nutrition'][number]
type Stats = { servings: number; featured: Row; original?: Row }

// Per-serving default row (and the traditional one) for each recipe, in book order, which is the
// same order as the headings.
const statsFor = (recipes: BookRecipe[]): Stats[] =>
  recipes.map(({ recipe: { nutrition, servings } }) => {
    const featured =
      nutrition.find(({ isDefault }) => isDefault) ?? nutrition[0]
    if (!featured) throw new Error('A recipe has no nutrition row')
    return {
      servings,
      featured,
      original: nutrition.find(({ kind }) => kind === 'traditional'),
    }
  })

const MACROS = [
  { key: 'carbs', label: 'Carbs', pct: 'carbsPct', grams: 'carbsG' },
  { key: 'fat', label: 'Fat', pct: 'fatPct', grams: 'fatG' },
  { key: 'protein', label: 'Protein', pct: 'proteinPct', grams: 'proteinG' },
] as const

// The same top block as the recipe page: calories and servings, the macro bar (pills sized by
// share of calories), and a faint strip showing the original recipe's split.
const statsHtml = ({ servings, featured, original }: Stats): string => {
  const ratios = toMacroRatios(featured)
  const pills = MACROS.map(
    ({ key, label, pct, grams }) =>
      `<div class="macro ${key}" style="flex: ${ratios[pct]} 1 0"><b>${ratios[pct]}%</b><span>${label}</span><small>${featured[grams]}g</small></div>`
  ).join('')
  const originalRatios = original && toMacroRatios(original)
  const strip = originalRatios
    ? `<div class="original">${MACROS.map(({ key, pct }) => `<div class="${key}" style="flex: ${originalRatios[pct]} 1 0"></div>`).join('')}</div>`
    : ''

  return (
    `<div class="stats"><div class="headline"><p><b>${featured.calories}</b><span>cals per serving</span></p>` +
    `<p class="servings"><b>${servings}</b><span>servings</span></p></div>` +
    `<div class="macros">${pills}</div>${strip}</div>`
  )
}

// Pandoc renders the heading as plain text. Split the "| $$ · ~35 min · ●●●○○" tail into a pill,
// mark the heading so each recipe starts on a new page, and build the two-column opener like the
// recipe page: the intro and stats on the left, the photo on the right. The servings count lives in
// the stats, so the intro drops its "Makes ~6 servings." line. A recipe with no photo keeps the
// plain intro.
const layoutRecipes = (html: string, stats: Stats[]): string => {
  let index = 0
  return html.replace(
    /(?:<p><a id="([^"]+)"><\/a><\/p>\s*)?<h2 id="([^"]+)">(\d+[a-z]?\. .+?) \| (.+?)<\/h2>(\s*<p>\s*<img class="photo"[^>]*>\s*<\/p>)?(\s*<p>[\s\S]*?<\/p>)/g,
    (
      _match,
      anchorId: string | undefined,
      headingId: string,
      title: string,
      pill: string,
      photo = '',
      intro: string
    ) => {
      const recipeStats = stats[index++]
      if (!recipeStats) throw new Error(`No nutrition for "${title}"`)
      // The quick reference links to the hand-written anchor. Put that id on the heading itself:
      // a standalone anchor sits before the page break, so a link lands at the end of the
      // previous page and shows the new recipe half way down the view.
      const id = anchorId ?? headingId
      const heading = `<h2 id="${id}" class="recipe-start"><span>${title}</span><span class="pill">${pill}</span></h2>`
      if (!photo) return `${heading}${intro}`

      const text = intro.replace(
        /\s*<strong>Makes ~?\d+ servings\.<\/strong>/,
        ''
      )
      const image = photo.replace(/<\/?p>/g, '').trim()
      return `${heading}<div class="hero"><div class="hero-text">${text.trim()}${statsHtml(recipeStats)}</div>${image}</div>`
    }
  )
}

// Ingredient lists are mostly short lines, so each runs in two columns to save pages.
const columnIngredients = (html: string): string =>
  html
    .replace(
      /(<h3 id="ingredients[^"]*">Ingredients<\/h3>)([\s\S]*?)(?=<h3 )/g,
      '$1<div class="ingredients">$2</div>'
    )
    // Nutrition tables get tighter rows than the rest of the book's tables
    .replace(
      /(<h3 id="nutrition[^"]*">Nutrition[^<]*<\/h3>)([\s\S]*?)(?=<h3 )/g,
      '$1<div class="nutrition">$2</div>'
    )

const renderHtml = (markdown: string, stats: Stats[]): string => {
  const body = execFileSync(
    'pandoc',
    ['--from', 'markdown+fenced_divs', '--to', 'html5', '--wrap=none'],
    { input: markdown, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  )

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Macro Makeovers</title><style>${STYLES}</style></head>
<body>${columnIngredients(layoutRecipes(body, stats))}</body>
</html>`
}

const main = async (): Promise<void> => {
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const recipes = await loadBookRecipes(process.argv.slice(2))
  const markdown = renderBookMarkdown(recipes, loadBookProse())
  const photos = await downloadPhotos(
    recipes,
    await loadBookPhotoUrls(process.argv.slice(2))
  )
  const html = renderHtml(addPhotos(markdown, photos), statsFor(recipes))
  writeFileSync(HTML_PATH, html)

  // CHROMIUM_PATH points at a browser you already have; otherwise Playwright's own is used
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
  })
  try {
    const page = await browser.newPage()
    await page.goto(pathToFileURL(HTML_PATH).href, { waitUntil: 'load' })
    await page.pdf({
      path: PDF_PATH,
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="width:100%;font:8px Georgia,serif;color:#777;text-align:center"><span class="pageNumber"></span></div>',
    })
  } finally {
    await browser.close()
  }

  console.log(`Wrote ${PDF_PATH}`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDb()
  })
