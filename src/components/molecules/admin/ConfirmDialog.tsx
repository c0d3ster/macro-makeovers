'use client'

import type { ReactElement, ReactNode } from 'react'

import { useEffect, useId, useRef } from 'react'

import { Button } from '@/components/atoms'

type ConfirmDialogProps = {
  title: string
  children: ReactNode
  confirmLabel: string
  pendingLabel: string
  isPending: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

// Red fill, so the risky action reads as risky
const DANGER = 'border border-red-500 bg-red-500 text-white hover:bg-red-600'

// A modal confirmation over the page, so asking never shifts the layout around the button. The
// native dialog handles Esc, keeps focus inside, and dims the page. Cancel comes first, so it
// takes the focus and a stray Enter never confirms. Render it only while asking.
export const ConfirmDialog = ({
  title,
  children,
  confirmLabel,
  pendingLabel,
  isPending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    // Test environments without showModal still get an open dialog
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Esc closes the dialog natively. Pending work keeps it open until it settles.
      onCancel={(event) => {
        event.preventDefault()
        if (!isPending) onCancel()
      }}
      className='m-auto w-[min(28rem,calc(100%-2rem))] rounded-xl border border-text-muted/20 bg-surface p-6 text-text shadow-xl backdrop:bg-black/50'
    >
      <h2 id={titleId} className='text-lg font-semibold'>
        {title}
      </h2>
      <div className='mt-2 text-sm text-text-muted'>{children}</div>
      {error && (
        <p role='alert' className='mt-3 text-sm text-red-400'>
          {error}
        </p>
      )}
      <div className='mt-6 flex flex-wrap justify-end gap-2'>
        <Button size='sm' variant='outline' disabled={isPending} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size='sm'
          disabled={isPending}
          onClick={onConfirm}
          className={DANGER}
        >
          {isPending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
