import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import type { GuideSlug } from './guideList'

// The guide prose lives in content/guides as plain markdown with no top heading. The site shows
// each file as its own page, and the printable book stitches them back into its sections, so
// one edit changes both.
const GUIDES_DIR = resolve(process.cwd(), 'content/guides')

const readContentFile = (name: string): string =>
  readFileSync(join(GUIDES_DIR, `${name}.md`), 'utf8').trim()

export const readGuide = (slug: GuideSlug): string => readContentFile(slug)

export const readAbout = (): string => readContentFile('about')

// The book's reading guide, which sits before the recipes
export const composeBookGuide = (readingRecipes: string): string =>
  `## How to read the recipes\n\n${readingRecipes}`

type BookOutroParts = {
  shopping: string
  nutrition: string
  about: string
}

// The book's closing sections. The anchor is what the intro's "Nutritional Foundation" link
// points at.
export const composeBookOutro = ({
  shopping,
  nutrition,
  about,
}: BookOutroParts): string =>
  [
    '## Second Helpings',
    '### Shopping tips',
    shopping,
    '<a id="nutritional-foundation"></a>',
    '### Nutritional Foundation',
    nutrition,
    about,
  ].join('\n\n')

export const loadBookGuideProse = (): { guide: string; outro: string } => ({
  guide: composeBookGuide(readGuide('reading-recipes')),
  outro: composeBookOutro({
    shopping: readGuide('shopping'),
    nutrition: readGuide('nutrition'),
    about: readAbout(),
  }),
})
