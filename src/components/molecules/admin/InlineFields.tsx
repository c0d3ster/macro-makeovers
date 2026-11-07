import type { ComponentProps, ReactElement, ReactNode } from 'react'

import { useId } from 'react'

// A faint outline marks what can be edited without turning the page back into a form
const INLINE_FIELD =
  'w-full min-w-0 rounded-md border border-text-muted/15 bg-transparent px-1.5 py-0.5 transition-colors placeholder:text-text-muted/50 hover:border-text-muted/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none aria-invalid:border-red-400'

// Selects also count as read-only to the browser, so this goes on text fields alone
const TEXT_FIELD = `${INLINE_FIELD} read-only:border-transparent`

const NO_SPINNERS =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

type FieldShellProps = {
  label: string
  error?: string
  errorId: string
  className?: string
  children: ReactNode
}

// The label is for screen readers only, since the field sits where its value will show. The
// error stays outside the label so it never becomes part of the field's name.
const FieldShell = ({
  label,
  error,
  errorId,
  className = '',
  children,
}: FieldShellProps): ReactElement => (
  <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
    <label className='flex min-w-0 flex-col'>
      <span className='sr-only'>{label}</span>
      {children}
    </label>
    {error && (
      <span
        id={errorId}
        role='alert'
        className='text-xs font-normal tracking-normal text-red-400 normal-case'
      >
        {error}
      </span>
    )}
  </div>
)

type InlineProps = {
  label: string
  error?: string
  // Classes for the wrapper, such as its width in a row
  fieldClassName?: string
}

export const InlineInput = ({
  label,
  error,
  fieldClassName,
  className = '',
  onKeyDown,
  ...props
}: InlineProps & ComponentProps<'input'>): ReactElement => {
  const errorId = useId()

  return (
    <FieldShell
      label={label}
      error={error}
      errorId={errorId}
      className={fieldClassName}
    >
      <input
        {...props}
        // With this many fields on the page, Enter in one should not save the form. A published
        // recipe updates right away, so saving stays a deliberate click.
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.preventDefault()
          onKeyDown?.(event)
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`${TEXT_FIELD} ${props.type === 'number' ? NO_SPINNERS : ''} ${className}`}
      />
    </FieldShell>
  )
}

// Grows with its text where the browser supports it, and falls back to `rows` elsewhere
export const InlineTextarea = ({
  label,
  error,
  fieldClassName,
  className = '',
  ...props
}: InlineProps & ComponentProps<'textarea'>): ReactElement => {
  const errorId = useId()

  return (
    <FieldShell
      label={label}
      error={error}
      errorId={errorId}
      className={fieldClassName}
    >
      <textarea
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`${TEXT_FIELD} field-sizing-content resize-none ${className}`}
      />
    </FieldShell>
  )
}

export const InlineSelect = ({
  label,
  error,
  fieldClassName,
  className = '',
  children,
  ...props
}: InlineProps & ComponentProps<'select'>): ReactElement => {
  const errorId = useId()

  return (
    <FieldShell
      label={label}
      error={error}
      errorId={errorId}
      className={fieldClassName}
    >
      <select
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`${INLINE_FIELD} cursor-pointer bg-background ${className}`}
      >
        {children}
      </select>
    </FieldShell>
  )
}

type AddRowButtonProps = {
  onClick: () => void
  children: ReactNode
}

export const AddRowButton = ({
  onClick,
  children,
}: AddRowButtonProps): ReactElement => (
  <button
    type='button'
    onClick={onClick}
    className='w-fit cursor-pointer rounded text-sm text-primary underline hover:no-underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
  >
    + {children}
  </button>
)

type RemoveRowButtonProps = {
  label: string
  onClick: () => void
}

export const RemoveRowButton = ({
  label,
  onClick,
}: RemoveRowButtonProps): ReactElement => (
  <button
    type='button'
    aria-label={label}
    title={label}
    onClick={onClick}
    className='flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-base leading-none text-text-muted hover:text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
  >
    &times;
  </button>
)
