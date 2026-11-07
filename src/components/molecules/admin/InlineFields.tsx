'use client'

import type {
  ComponentProps,
  KeyboardEvent,
  ReactElement,
  ReactNode,
} from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

import { useId, useRef, useState } from 'react'

import { Markdown } from '@/components/atoms'

// No outline until hover or focus, so the editor reads like the page. The negative margin lines
// the text up with the page's text instead of the field's padding.
const INLINE_FIELD =
  'min-w-0 -mx-[7px] rounded-md border border-transparent bg-transparent px-1.5 py-0.5 transition-colors placeholder:text-text-muted/50 hover:border-text-muted/30 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none read-only:hover:border-transparent aria-invalid:border-red-400'

const FULL_WIDTH = 'w-[calc(100%+14px)]'

// Shrinks to its value, like the number it stands in for
const FIT_WIDTH = 'w-auto min-w-[3ch] field-sizing-content'

const NO_SPINNERS =
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

// For controls that only matter while editing a row, like remove. Touch screens have no hover,
// so they always show there.
export const SHOW_ON_ROW_HOVER =
  'opacity-0 transition-opacity group-focus-within/editable:opacity-100 group-hover/editable:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'

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
        className='text-xs font-normal tracking-normal text-red-400 normal-case not-italic'
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

type InlineInputProps = InlineProps &
  ComponentProps<'input'> & {
    // Size to the value instead of filling the row
    fit?: boolean
  }

export const InlineInput = ({
  label,
  error,
  fieldClassName,
  className = '',
  fit = false,
  onKeyDown,
  ...props
}: InlineInputProps): ReactElement => {
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
        className={`${INLINE_FIELD} ${fit ? FIT_WIDTH : FULL_WIDTH} ${props.type === 'number' ? NO_SPINNERS : ''} ${className}`}
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
        className={`${INLINE_FIELD} ${FULL_WIDTH} field-sizing-content resize-none ${className}`}
      />
    </FieldShell>
  )
}

type MarkdownFieldProps = InlineProps & {
  // The current text, watched by the caller, so the rendered version stays in step
  value: string
  registration: UseFormRegisterReturn
  placeholder?: string
  rows?: number
  className?: string
}

// Markdown shows rendered, as the page will show it, and turns back into its text on click or
// Enter. Empty text stays a field, so a new step or note can be typed into right away.
export const MarkdownField = ({
  label,
  error,
  fieldClassName,
  value,
  registration,
  placeholder,
  rows = 2,
  className = '',
}: MarkdownFieldProps): ReactElement => {
  const [isEditing, setIsEditing] = useState(false)
  // Set when the rendered text is clicked, so the field that replaces it takes the focus
  const focusOnMountRef = useRef(false)

  if (isEditing || !value.trim() || error) {
    return (
      <InlineTextarea
        label={label}
        error={error}
        fieldClassName={fieldClassName}
        rows={rows}
        placeholder={placeholder}
        className={className}
        {...registration}
        ref={(element) => {
          registration.ref(element)
          if (!element || !focusOnMountRef.current) return
          focusOnMountRef.current = false
          element.focus()
          element.setSelectionRange(element.value.length, element.value.length)
        }}
        onFocus={() => setIsEditing(true)}
        onBlur={(event) => {
          setIsEditing(false)
          void registration.onBlur(event)
        }}
      />
    )
  }

  const edit = (): void => {
    focusOnMountRef.current = true
    setIsEditing(true)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    edit()
  }

  return (
    <div
      role='button'
      tabIndex={0}
      aria-label={`Edit ${label}`}
      onClick={edit}
      onKeyDown={onKeyDown}
      // A link in the text opens the editor instead of leaving the page with unsaved changes
      onClickCapture={(event) => {
        if (event.target instanceof Element && event.target.closest('a')) {
          event.preventDefault()
        }
      }}
      className={`${INLINE_FIELD} ${FULL_WIDTH} cursor-text text-left ${className} ${fieldClassName ?? ''}`}
    >
      <Markdown>{value}</Markdown>
    </div>
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

type PlaceholderButtonProps = {
  onClick: () => void
  children: ReactNode
  className?: string
}

// Stands where an empty section's content will go, in that content's shape
export const PlaceholderButton = ({
  onClick,
  children,
  className = '',
}: PlaceholderButtonProps): ReactElement => (
  <button
    type='button'
    onClick={onClick}
    className={`w-full cursor-pointer rounded-xl border border-dashed border-text-muted/30 px-4 py-3 text-left text-sm text-text-muted/80 transition-colors hover:border-primary hover:text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${className}`}
  >
    {children}
  </button>
)

type RemoveRowButtonProps = {
  label: string
  onClick: () => void
}

// Shows while its row, marked `group/editable`, is hovered or focused
export const RemoveRowButton = ({
  label,
  onClick,
}: RemoveRowButtonProps): ReactElement => (
  <button
    type='button'
    aria-label={label}
    title={label}
    onClick={onClick}
    className={`flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-base leading-none text-text-muted hover:text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${SHOW_ON_ROW_HOVER}`}
  >
    &times;
  </button>
)
