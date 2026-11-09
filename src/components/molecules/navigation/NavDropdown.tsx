'use client'

import type { KeyboardEvent, ReactElement } from 'react'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

export type NavLink = {
  label: string
  href: string
}

type NavDropdownProps = {
  label: string
  // The section's own page, the menu's first item
  href: string
  items: NavLink[]
  // The trigger's look, matching the plain nav links
  className: string
  // Taken out of the tab order while the nav is held back
  tabIndex?: number
}

const ITEM_CLASS =
  'block w-full px-4 py-2 text-left text-sm text-text hover:bg-background focus-visible:bg-background focus-visible:outline-none'

// A nav link with a menu of sub-pages, like Guides. Phones get these from MobileNav instead.
// The menu closes on Escape, on a click outside, and when an item is chosen, and the arrow
// keys move between the items.
export const NavDropdown = ({
  label,
  href,
  items,
  className,
  tabIndex,
}: NavDropdownProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return undefined

    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const closeOnOutside = (event: PointerEvent): void => {
      const { target } = event
      if (target instanceof Node && rootRef.current?.contains(target)) return
      setIsOpen(false)
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

    // Like a native menu button, ArrowDown on the closed trigger opens it on the first item
    if (!isOpen && event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      return
    }

    const links = [
      ...(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
        []),
    ]
    // -1 when focus is on the trigger, so ArrowUp wraps to the last item, not the second-to-last
    const current = links.findIndex((link) => link === document.activeElement)
    const target = {
      ArrowDown: (current + 1) % links.length,
      ArrowUp: current <= 0 ? links.length - 1 : current - 1,
      Home: 0,
      End: links.length - 1,
    }[event.key]
    if (target === undefined || links.length === 0) return

    event.preventDefault()
    links[target]?.focus()
  }

  return (
    <div ref={rootRef} className='relative'>
      <button
        ref={triggerRef}
        type='button'
        tabIndex={tabIndex}
        aria-haspopup='menu'
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onKeyDown={onKeyDown}
        onClick={() => setIsOpen(!isOpen)}
        className={`${className} flex cursor-pointer items-center gap-1`}
      >
        {label}
        <svg
          aria-hidden='true'
          viewBox='0 0 20 20'
          className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill='currentColor'
        >
          <path d='M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z' />
        </svg>
      </button>
      {isOpen && (
        <div
          id={menuId}
          role='menu'
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className='absolute top-full left-1/2 mt-3 w-56 -translate-x-1/2 overflow-hidden rounded-lg border border-text-muted/20 bg-surface py-1 shadow-lg'
        >
          {[{ label: `All ${label.toLowerCase()}`, href }, ...items].map(
            (item) => (
              <Link
                key={item.href}
                role='menuitem'
                href={item.href}
                onClick={close}
                className={ITEM_CLASS}
              >
                {item.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  )
}
