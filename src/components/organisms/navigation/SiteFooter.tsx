import type { ReactElement } from 'react'

import Link from 'next/link'

import { NutritionNote } from '@/components/molecules'
import { Env } from '@/libs/Env'
// The list only, not the barrel: the barrel also reads the legal files from disk
import { LEGAL_PAGES } from '@/libs/legal/legalList'

// The bottom of every public page: the nutrition note and the legal links
export const SiteFooter = (): ReactElement => (
  <footer className='mt-16 border-t border-text-muted/20 bg-surface'>
    <div className='mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-text-muted sm:px-6 lg:px-8'>
      <NutritionNote />
      <nav aria-label='Legal'>
        <ul className='flex flex-wrap gap-x-5 gap-y-2'>
          {LEGAL_PAGES.map(({ slug, label }) => (
            <li key={slug}>
              <Link href={`/${slug}`} className='underline hover:text-text'>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p>
        &copy; {new Date().getFullYear()} {Env.NEXT_PUBLIC_BRAND_NAME}
      </p>
    </div>
  </footer>
)
