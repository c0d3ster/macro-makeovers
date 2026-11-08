import type { StoredBasket } from '@/libs/basket'

import {
  BASKET_STORAGE_KEY,
  EMPTY_BASKET,
  parseStoredBasket,
} from '@/libs/basket'

type Listener = () => void

// The basket saved in this browser, shaped for useSyncExternalStore. It reads storage once,
// keeps the parsed copy so every render sees the same object, writes through on change, and
// follows changes made in other tabs.
export class BasketStore {
  private snapshot: StoredBasket | undefined

  private readonly listeners = new Set<Listener>()

  subscribe = (listener: Listener): (() => void) => {
    if (this.listeners.size === 0)
      window.addEventListener('storage', this.onStorage)
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
      if (this.listeners.size === 0)
        window.removeEventListener('storage', this.onStorage)
    }
  }

  getSnapshot = (): StoredBasket => {
    this.snapshot ??= this.read()
    return this.snapshot
  }

  // The server has no saved basket, so it and the first client render show an empty one
  getServerSnapshot = (): StoredBasket => EMPTY_BASKET

  update = (change: (current: StoredBasket) => StoredBasket): void => {
    const next = change(this.getSnapshot())
    if (next === this.snapshot) return
    this.snapshot = next
    this.write(next)
    this.emit()
  }

  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key !== BASKET_STORAGE_KEY) return
    this.snapshot = parseStoredBasket(event.newValue)
    this.emit()
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener())
  }

  private read(): StoredBasket {
    try {
      return parseStoredBasket(localStorage.getItem(BASKET_STORAGE_KEY))
    } catch {
      // Storage can be blocked (private mode, site data off). The basket still works for the visit.
      return EMPTY_BASKET
    }
  }

  private write(basket: StoredBasket): void {
    try {
      localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket))
    } catch {
      // Same as above: keep going without saving
    }
  }
}
