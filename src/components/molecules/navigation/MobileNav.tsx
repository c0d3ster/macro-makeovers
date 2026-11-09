'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

import type { NavLink } from './NavDropdown'

export type MobileNavItem = {
  id: string
  label: string
  href: string
  children?: NavLink[]
}

type MobileNavProps = {
  items: MobileNavItem[]
  activeItem?: string
}

const linkClass = (isActive: boolean): string =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-header-muted/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${isActive ? 'text-header-text' : 'text-header-muted hover:text-header-text'}`

// The phone nav: a menu button that drops a panel of links down under the header. It is a
// disclosure, not a menu, so the links tab like any other. It closes on Escape, on a click
// outside, and when a link is chosen.
export const MobileNav = ({
  items,
  activeItem,
}: MobileNavProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnOutside = (event: PointerEvent): void => {
      const { target } = event
      if (target instanceof Node && rootRef.current?.contains(target)) return
      setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const close = (): void => setIsOpen(false)

  // No position here, so the panel lines up with the fixed header, not the button
  return (
    <div ref={rootRef} className='sm:hidden'>
      <button
        ref={triggerRef}
        type='button'
        aria-label='Menu'
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
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
        >
          {isOpen ? (
            <path d='M6 6l12 12M18 6L6 18' />
          ) : (
            <path d='M4 7h16M4 12h16M4 17h16' />
          )}
        </svg>
      </button>
      {isOpen && (
        <nav
          id={panelId}
          aria-label='Site'
          className='absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-header-muted/20 bg-header px-4 py-3 shadow-lg'
        >
          <ul className='space-y-1'>
            {items.map(({ id, label, href, children }) => (
              <li key={id}>
                <Link
                  href={href}
                  onClick={close}
                  aria-current={activeItem === id ? 'page' : undefined}
                  className={linkClass(activeItem === id)}
                >
                  {label}
                </Link>
                {children && (
                  <ul className='mt-1 ml-3 space-y-1 border-l border-header-muted/20 pl-2'>
                    {children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={close}
                          className={linkClass(false)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
