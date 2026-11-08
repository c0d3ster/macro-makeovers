'use client'

import type { ReactElement } from 'react'

import { useState } from 'react'

// Sending the basket to a grocer's cart is a paid feature (PRD 05) that isn't built yet. The
// button stays visible so people know it's coming, and says so when tapped.
export const SendToCart = (): ReactElement => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className='rounded-xl bg-surface p-4'>
      <button
        type='button'
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className='w-full cursor-pointer rounded-lg bg-primary px-4 py-3 font-medium text-on-primary transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none'
      >
        Send to cart
      </button>
      {isOpen && (
        <p className='mt-3 text-sm text-text-muted'>
          Sending your basket straight to a grocery store's cart is coming with
          the paid plan, with a choice of stores. For now, copy the list and
          take it with you.
        </p>
      )}
    </div>
  )
}
