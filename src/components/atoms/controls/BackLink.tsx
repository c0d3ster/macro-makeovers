import type { ReactElement, ReactNode } from 'react'

import Link from 'next/link'

type BackLinkProps = {
  href: string
  children: ReactNode
}

// The quiet "<- All recipes" link at the top of a page
export const BackLink = ({ href, children }: BackLinkProps): ReactElement => (
  <Link
    href={href}
    className='w-fit text-sm text-text-muted hover:text-primary'
  >
    &larr; {children}
  </Link>
)
