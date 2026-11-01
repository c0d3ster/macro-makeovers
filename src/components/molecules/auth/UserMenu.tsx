'use client'

import type { KeyboardEvent, ReactElement } from 'react'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

import { useAuth } from '@/providers'

const ITEM_CLASS =
  'block w-full cursor-pointer px-4 py-2 text-left text-sm text-text hover:bg-background focus-visible:bg-background focus-visible:outline-none'

// A person icon that opens My account and Sign out. It closes on Escape,
// on a click outside, and when an item is chosen, and the arrow keys move between the items.
export const UserMenu = (): ReactElement => {
  const { signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return undefined

    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const closeOnOutside = (event: PointerEvent): void => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [isOpen])

  const close = (): void => setIsOpen(false)

  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      close()
      triggerRef.current?.focus()
      return
    }

    const items = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
        []),
    ]
    const current = items.indexOf(document.activeElement as HTMLElement)
    const target = {
      ArrowDown: (current + 1) % items.length,
      ArrowUp: (current - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    }[event.key]
    if (target === undefined || items.length === 0) return

    event.preventDefault()
    items[target]?.focus()
  }

  return (
    <div ref={rootRef} className='relative'>
      <button
        ref={triggerRef}
        type='button'
        aria-label='Account menu'
        aria-haspopup='menu'
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onKeyDown={onKeyDown}
        onClick={() => setIsOpen(!isOpen)}
        className='flex size-9 cursor-pointer items-center justify-center rounded-full text-header-muted transition-colors hover:text-header-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
      >
        <svg
          aria-hidden='true'
          viewBox='0 0 24 24'
          className='size-6'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.75'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <circle cx='12' cy='8' r='4' />
          <path d='M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7' />
        </svg>
      </button>
      {isOpen && (
        <div
          id={menuId}
          role='menu'
          aria-label='Account'
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className='absolute top-full right-0 mt-2 w-48 overflow-hidden rounded-lg border border-text-muted/20 bg-surface py-1 shadow-lg'
        >
          <Link
            role='menuitem'
            href='/profile'
            onClick={close}
            className={ITEM_CLASS}
          >
            My account
          </Link>
          <button
            type='button'
            role='menuitem'
            onClick={() => {
              close()
              void signOut()
            }}
            className={ITEM_CLASS}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
