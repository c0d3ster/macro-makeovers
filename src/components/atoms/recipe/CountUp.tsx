import type { CSSProperties, ReactElement } from 'react'

type CountUpProps = {
  value: number
  className?: string
}

// A number that counts up from 0 on load, in CSS only. The real number is in the DOM but
// transparent, so it holds the width, reads aloud and copies. An overlay draws the rolling one.
export const CountUp = ({
  value,
  className = '',
}: CountUpProps): ReactElement => (
  <span
    className={`macro-count-up relative inline-block text-transparent tabular-nums ${className}`}
    style={{ '--count': value } as CSSProperties}
  >
    {value}
  </span>
)
