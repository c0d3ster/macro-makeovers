import type { ReactElement } from 'react'

export type FilterOption = {
  value: string
  label: string
  // Grayed out and not pickable, for choices that would return nothing
  disabled?: boolean
}

type FilterSelectProps = {
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  // Text of the empty choice, or false for a select that always has a value, like sort
  anyLabel?: string | false
  // A dot in a macro's color, drawn beside the label
  dotClassName?: string
  // Puts the label beside the select at every size, or from the large breakpoint up
  inline?: boolean
  inlineFromLg?: boolean
  labelClassName?: string
  className?: string
  name?: string
}

export const FILTER_FIELD_CLASS =
  'w-full rounded-lg border border-text-muted/30 bg-background px-3 py-2 text-sm text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'

export const FilterSelect = ({
  label,
  options,
  value,
  onChange,
  anyLabel = 'Any',
  dotClassName,
  inline = false,
  inlineFromLg = false,
  labelClassName = '',
  className = '',
  name,
}: FilterSelectProps): ReactElement => (
  <label
    className={`flex min-w-0 flex-col gap-1 text-xs font-medium text-text-muted ${
      inline ? 'flex-row items-center gap-2' : ''
    } ${inlineFromLg ? 'lg:flex-row lg:items-center lg:gap-2' : ''} ${className}`}
  >
    <span className={`flex shrink-0 items-center gap-1.5 ${labelClassName}`}>
      {dotClassName && (
        <span
          aria-hidden='true'
          className={`size-2 shrink-0 rounded-full ${dotClassName}`}
        />
      )}
      {label}
    </span>
    {/* The arrow is drawn here instead of by the browser, so its spacing is ours to set */}
    <span
      className={`relative flex min-w-0 ${inline ? 'flex-1' : ''} ${
        inlineFromLg ? 'lg:flex-1' : ''
      }`}
    >
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${FILTER_FIELD_CLASS} min-w-0 cursor-pointer appearance-none pr-8`}
      >
        {anyLabel !== false && <option value=''>{anyLabel}</option>}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden='true'
        viewBox='0 0 16 16'
        className='pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-text-muted'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M4 6l4 4 4-4' />
      </svg>
    </span>
  </label>
)
