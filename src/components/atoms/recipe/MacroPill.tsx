import type { ReactElement } from 'react'

type MacroPillProps = {
  label: string
  value: number
  unit?: string
  // The one number the card leads with, protein for this site
  featured?: boolean
}

export const MacroPill = ({
  label,
  value,
  unit = '',
  featured = false,
}: MacroPillProps): ReactElement => (
  <div
    className={`flex flex-col items-center rounded-lg px-2 py-1.5 ${featured ? 'bg-accent/15 text-accent' : 'bg-background text-text'}`}
  >
    <span className='text-base leading-tight font-semibold'>
      {value}
      {unit}
    </span>
    <span className='text-xs text-text-muted'>{label}</span>
  </div>
)
