import type { ReactElement } from 'react'

type MacroPillProps = {
  label: string
  // Share of calories, the number the pill leads with
  percent: number
  grams: number
}

export const MacroPill = ({
  label,
  percent,
  grams,
}: MacroPillProps): ReactElement => (
  <div className='flex flex-col items-center rounded-lg border border-text-muted/30 bg-background px-2 py-1.5 text-text'>
    <span className='text-base leading-tight font-semibold'>{percent}%</span>
    <span className='text-xs text-text-muted'>{label}</span>
    <span className='text-[0.65rem] leading-tight text-text-muted'>
      {grams}g
    </span>
  </div>
)
