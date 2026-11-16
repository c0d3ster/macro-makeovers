import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { Env } from '@/libs/Env'

import type { LegalSlug } from './legalList'

// The business behind the site
const LEGAL_ENTITY = 'c0d3ster LLC'

// The legal prose lives in content/legal as plain markdown with no top heading. {{brand}},
// {{entity}}, and {{email}} are filled in here so the files stay in step with the site settings.
const LEGAL_DIR = resolve(process.cwd(), 'content/legal')

export const fillLegalText = (
  text: string,
  brand: string,
  email: string
): string =>
  text
    .replaceAll('{{brand}}', brand)
    .replaceAll('{{entity}}', LEGAL_ENTITY)
    .replaceAll('{{email}}', `[${email}](mailto:${email})`)

export const readLegalPage = (slug: LegalSlug): string =>
  fillLegalText(
    readFileSync(join(LEGAL_DIR, `${slug}.md`), 'utf8').trim(),
    Env.NEXT_PUBLIC_BRAND_NAME,
    Env.SUPPORT_EMAIL
  )
