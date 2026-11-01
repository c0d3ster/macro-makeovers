// Builds the printable recipe book (build/macro-makeovers.pdf) from docs/recipes.md and the
// photos in public/images. Needs pandoc on the PATH. Run with `pnpm book:pdf`.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { chromium } from '@playwright/test'

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
  .photo { width: 100%; height: 2.6in; object-fit: cover; border-radius: 6pt; margin: 0.08in 0 0.12in; display: block; }
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

// Puts the photo straight under each recipe heading, before pandoc sees the markdown.
const addPhotos = (markdown: string): string =>
  markdown.replace(RECIPE_HEADING, (heading, number: string) => {
    const image = imageFor(number)
    if (!image) {
      console.warn(`No photo for recipe ${number}`)
      return heading
    }
    return `${heading}\n\n<img class="photo" src="${pathToFileURL(image).href}" alt="">`
  })

// Pandoc renders the heading as plain text. Split the "| $$ · ~35 min · ●●●○○" tail into a pill
// and mark the heading so each recipe starts on a new page.
const stylePills = (html: string): string =>
  html.replace(
    /<h2 id="([^"]+)">(\d+[a-z]?\. .+?) \| (.+?)<\/h2>/g,
    (_match, id: string, title: string, pill: string) =>
      `<h2 id="${id}" class="recipe-start"><span>${title}</span><span class="pill">${pill}</span></h2>`
  )

const renderHtml = (markdown: string): string => {
  const body = execFileSync(
    'pandoc',
    ['--from', 'markdown+fenced_divs', '--to', 'html5', '--wrap=none'],
    { input: markdown, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  )

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Macro Makeovers</title><style>${STYLES}</style></head>
<body>${stylePills(body)}</body>
</html>`
}

const main = async (): Promise<void> => {
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const html = renderHtml(addPhotos(readFileSync(SOURCE, 'utf8')))
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
