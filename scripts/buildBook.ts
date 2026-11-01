import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { parseRecipesMarkdown } from '@/libs/recipes'

// Builds the printable recipe book (build/macro-makeovers.pdf) from docs/recipes.md and the
// photos in public/images. Needs pandoc on the PATH. Run with `pnpm book:pdf`.
const ROOT = process.cwd()
const SOURCE = resolve(ROOT, 'docs/recipes.md')
const IMAGE_DIR = resolve(ROOT, 'public/images')
const OUTPUT_DIR = resolve(ROOT, 'build')
const HTML_PATH = resolve(OUTPUT_DIR, 'macro-makeovers.html')
const PDF_PATH = resolve(OUTPUT_DIR, 'macro-makeovers.pdf')

// "## 7. Lemon Pepper Shrimp Pesto Linguine | $$$ · ~50 min · ●●●○○", "## 10a. ..."
const RECIPE_HEADING = /^## (\d+[a-z]?)\. (.+?) \| (.+)$/gm

const STYLES = `
  @page { size: Letter; margin: 0.7in 0.75in 0.8in; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 10pt; line-height: 1.45; color: #222; margin: 0; }
  h1 { font-size: 26pt; margin: 0 0 0.1in; padding-bottom: 6pt; border-bottom: 2px solid #222; }
  h2 { font-size: 15pt; margin: 0.3in 0 0.1in; padding-bottom: 4pt; border-bottom: 1px solid #999; }
  h3 { font-size: 11pt; margin: 0.2in 0 0.06in; color: #444; }
  h4 { font-size: 10pt; margin: 0.14in 0 0.04in; }
  h2, h3, h4, p:has(> strong:only-child) { break-after: avoid; }
  p { margin: 0 0 0.08in; }
  a { color: #2a5a9a; text-decoration: none; }
  ul, ol { margin: 0 0 0.1in; padding-left: 0.3in; }
  li { margin-bottom: 2pt; }
  table { width: 100%; border-collapse: collapse; margin: 0.08in 0 0.12in; font-size: 9pt; break-inside: avoid; }
  th, td { border: 1px solid #bbb; padding: 4pt 7pt; text-align: left; }
  th { background: #eee; }
  blockquote { margin: 0.1in 0; padding: 6pt 10pt; background: #f5f5ef; border-left: 3px solid #888; font-size: 9pt; break-inside: avoid; }
  blockquote p:last-child { margin-bottom: 0; }
  hr { display: none; }
  .recipe-start { break-before: page; }
  h2.recipe-start { display: flex; justify-content: space-between; align-items: center; gap: 12pt; margin-top: 0; }
  .pill { flex: none; font-size: 9pt; font-weight: normal; padding: 4pt 10pt; border-radius: 12pt; background: #efeedd; border: 1px solid #d8d6bc; color: #444; }
  .hero { display: flex; gap: 0.2in; align-items: stretch; margin: 0.08in 0 0.12in; break-inside: avoid; }
  .hero-text { flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 8pt; }
  .hero-text p { margin: 0; }
  .photo { flex: none; width: 3.1in; height: 2.1in; object-fit: cover; border-radius: 6pt; display: block; }
  .strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5pt; }
  .strip div { text-align: center; padding: 4pt 2pt; border-radius: 4pt; background: #f5f5ef; border-top: 3px solid #bbb; }
  .strip b { display: block; font-size: 12pt; }
  .strip span { font-size: 7.5pt; color: #666; text-transform: uppercase; letter-spacing: 0.04em; }
  .strip .carbs { border-top-color: rgb(117 132 205); }
  .strip .fat { border-top-color: rgb(214 168 82); }
  .strip .protein { border-top-color: rgb(112 164 124); }
  .servings { font-size: 8.5pt; color: #666; }
  .quickref { break-inside: avoid; }
  .quickref table { margin-top: 0.04in; }
  .quickref td, .quickref th { padding: 3pt 7pt; white-space: nowrap; }
  .quickref td:first-child { width: 52%; white-space: normal; }
`

const imageFor = (number: string): string | undefined => {
  const prefix = `${number.replace(/^\d+/, (digits) => digits.padStart(2, '0'))}-`
  const file = readdirSync(IMAGE_DIR).find((name) => name.startsWith(prefix))
  return file ? resolve(IMAGE_DIR, file) : undefined
}

// The photo goes in as a marker image right under each recipe heading, before pandoc runs.
// layoutHero() later moves it next to the intro.
const addPhotos = (markdown: string): string =>
  markdown.replace(RECIPE_HEADING, (heading, number: string) => {
    const image = imageFor(number)
    if (!image) {
      console.warn(`No photo for recipe ${number}`)
      return heading
    }
    return `${heading}\n\n<img class="photo" src="${pathToFileURL(image).href}" alt="">`
  })

type Strip = {
  calories: number
  carbsG: number
  fatG: number
  proteinG: number
  servings: number
}

// Per-serving default row for each recipe, in book order (the same order as the headings).
const stripsFor = (markdown: string): Strip[] =>
  parseRecipesMarkdown(markdown).map(({ nutrition, servings }) => {
    const row = nutrition.find(({ isDefault }) => isDefault) ?? nutrition[0]
    if (!row) throw new Error('A recipe has no nutrition row')
    return { ...row, servings }
  })

const stripHtml = ({
  calories,
  carbsG,
  fatG,
  proteinG,
  servings,
}: Strip): string =>
  `<div class="macros"><div class="strip"><div><b>~${calories}</b><span>Cal</span></div>` +
  `<div class="carbs"><b>${carbsG}g</b><span>Carbs</span></div>` +
  `<div class="fat"><b>${fatG}g</b><span>Fat</span></div>` +
  `<div class="protein"><b>${proteinG}g</b><span>Protein</span></div></div>` +
  `<div class="servings">Per serving, makes ${servings}</div></div>`

// Pandoc renders the heading as plain text. Split the "| $$ · ~35 min · ●●●○○" tail into a pill,
// mark the heading so each recipe starts on a new page, and put the intro and a macro strip on the
// left with the photo on the right. A recipe with no photo keeps the plain intro.
const layoutRecipes = (html: string, strips: Strip[]): string => {
  let index = 0
  return html.replace(
    /<h2 id="([^"]+)">(\d+[a-z]?\. .+?) \| (.+?)<\/h2>(\s*<p>\s*<img class="photo"[^>]*>\s*<\/p>)?(\s*<p>[\s\S]*?<\/p>)/g,
    (
      _match,
      id: string,
      title: string,
      pill: string,
      photo = '',
      intro: string
    ) => {
      const strip = strips[index++]
      if (!strip) throw new Error(`No nutrition for "${title}"`)
      const heading = `<h2 id="${id}" class="recipe-start"><span>${title}</span><span class="pill">${pill}</span></h2>`
      if (!photo) return `${heading}${intro}`
      return `${heading}<div class="hero"><div class="hero-text">${intro}${stripHtml(strip)}</div>${photo.replace(/<\/?p>/g, '').trim()}</div>`
    }
  )
}

const renderHtml = (markdown: string, strips: Strip[]): string => {
  const body = execFileSync(
    'pandoc',
    ['--from', 'markdown+fenced_divs', '--to', 'html5', '--wrap=none'],
    { input: markdown, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  )

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Macro Makeovers</title><style>${STYLES}</style></head>
<body>${layoutRecipes(body, strips)}</body>
</html>`
}

const main = async (): Promise<void> => {
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const markdown = readFileSync(SOURCE, 'utf8')
  const html = renderHtml(addPhotos(markdown), stripsFor(markdown))
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

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
