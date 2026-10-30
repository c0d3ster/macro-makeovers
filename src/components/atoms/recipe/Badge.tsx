import type { ReactElement, ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
}

export const Badge = ({ children }: BadgeProps): ReactElement => (
  <span className='rounded-full border border-text-muted/30 bg-background px-2.5 py-0.5 text-xs text-text-muted'>
    {children}
  </span>
)
