import type { ReactElement, ReactNode } from 'react'

import Link from 'next/link'

type HomeSectionProps = {
  title: string
  // One line under the title
  intro?: string
  // A quiet "see all" link beside the title
  more?: { href: string; label: string }
  children: ReactNode
}

export const HomeSection = ({
  title,
  intro,
  more,
  children,
}: HomeSectionProps): ReactElement => (
  <section className='mt-16'>
    <div className='mb-5 flex flex-wrap items-end justify-between gap-2'>
      <div>
        <h2 className='text-2xl font-bold text-text'>{title}</h2>
        {intro && <p className='mt-1 text-text-muted'>{intro}</p>}
      </div>
      {more && (
        <Link
          href={more.href}
          className='text-sm text-text-muted underline hover:text-text'
        >
          {more.label}
        </Link>
      )}
    </div>
    {children}
  </section>
)
