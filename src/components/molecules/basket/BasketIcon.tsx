import type { ReactElement } from 'react'

type BasketIconProps = {
  className?: string
}

// A shopping basket outline, sized by its class
export const BasketIcon = ({
  className = 'size-5',
}: BasketIconProps): ReactElement => (
  <svg
    aria-hidden='true'
    viewBox='0 0 24 24'
    className={className}
    fill='none'
    stroke='currentColor'
    strokeWidth='1.75'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M3 10h18l-1.6 8.4a2 2 0 0 1-2 1.6H6.6a2 2 0 0 1-2-1.6L3 10Z' />
    <path d='M8 10l3-6M16 10l-3-6' />
    <path d='M9 14v2M12 14v2M15 14v2' />
  </svg>
)
