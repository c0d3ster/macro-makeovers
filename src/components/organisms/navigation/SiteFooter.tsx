import type { ReactElement } from 'react'

import Link from 'next/link'

import type { NavLink } from '@/components/molecules'

import { NutritionNote } from '@/components/molecules'
import { Env } from '@/libs/Env'
// The list only, not the barrel: the barrel also reads the legal files from disk
import { LEGAL_PAGES } from '@/libs/legal/legalList'

const CONTACT_EMAIL = 'hello@macromakeovers.com'

type SiteFooterProps = {
  // The site's main pages, the same ones the header shows
  links: NavLink[]
}

const linkClass = 'hover:text-text hover:underline'

// The bottom of every public page: site links, a way to reach us, the nutrition note, and the
// legal links
export const SiteFooter = ({ links }: SiteFooterProps): ReactElement => (
  <footer className='mt-16 border-t border-text-muted/20 bg-surface'>
    <div className='mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 text-sm text-text-muted sm:px-6 lg:px-8'>
      <div className='grid gap-8 sm:grid-cols-[2fr_1fr_1fr]'>
        <div className='flex flex-col gap-2'>
          <p className='text-lg font-semibold text-text'>
            {Env.NEXT_PUBLIC_BRAND_NAME}
          </p>
          <p className='max-w-sm'>
            Comfort food rebuilt to fit your macros, with the protein to back it up.
          </p>
        </div>

        <nav aria-label='Site'>
          <p className='mb-3 font-semibold tracking-wide text-text uppercase'>Explore</p>
          <ul className='flex flex-col gap-2'>
            {links.map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className={linkClass}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className='mb-3 font-semibold tracking-wide text-text uppercase'>Get in touch</p>
          <ul className='flex flex-col gap-2'>
            <li>
              <Link href='/about#contact' className={linkClass}>
                Suggest a makeover
              </Link>
            </li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className='flex flex-col gap-4 border-t border-text-muted/20 pt-6'>
        <NutritionNote />
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
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
      </div>
    </div>
  </footer>
)
