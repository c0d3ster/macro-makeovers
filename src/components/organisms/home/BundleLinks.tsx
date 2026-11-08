import type { ReactElement } from 'react'

import Link from 'next/link'

import { AddBundleButton } from '@/components/molecules'
import { formatMoney } from '@/libs/basket'

export type BundleLink = {
  recipes: { slug: string; title: string }[]
  saving: number
}

type BundleLinksProps = {
  bundles: BundleLink[]
}

// Pairs of recipes that share the most packs, each with what buying together saves
export const BundleLinks = ({ bundles }: BundleLinksProps): ReactElement => (
  <ul className='grid grid-cols-1 gap-3 md:grid-cols-3'>
    {bundles.map(({ recipes, saving }) => (
      <li
        key={recipes.map(({ slug }) => slug).join('+')}
        className='flex flex-col gap-3 rounded-xl bg-surface p-4'
      >
        <p className='text-text'>
          {recipes.map(({ slug, title }, index) => (
            <span key={slug}>
              {index > 0 && <span className='text-text-muted'> + </span>}
              <Link
                href={`/recipes/${slug}`}
                className='font-semibold hover:text-primary'
              >
                {title}
              </Link>
            </span>
          ))}
        </p>
        <p className='text-sm text-text-muted'>
          Saves{' '}
          <span className='font-semibold text-text'>{formatMoney(saving)}</span>{' '}
          over buying each on its own
        </p>
        <div className='mt-auto'>
          <AddBundleButton slugs={recipes.map(({ slug }) => slug)} />
        </div>
      </li>
    ))}
  </ul>
)
