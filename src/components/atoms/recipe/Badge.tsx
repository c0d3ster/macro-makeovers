import type { ReactElement, ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
}

export const Badge = ({ children }: BadgeProps): ReactElement => (
  <span className='rounded-full bg-background px-2 py-0.5 text-xs text-text-muted'>
    {children}
  </span>
)
