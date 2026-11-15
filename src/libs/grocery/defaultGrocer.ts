import type { GrocerId } from './groceryTypes'

type DefaultInput = {
  // Grocers turned on and configured, in any order
  available: GrocerId[]
  // The member's last choice, if any
  remembered?: GrocerId
  // Whether a Kroger-family store is near the member's zip. Undefined when not checked yet.
  krogerNearby?: boolean
}

// The grocer the picker preselects: the member's last choice, else Kroger pickup if a store is
// nearby, else Walmart pickup. Instacart is never the default, since its checkout runs above our
// estimate; members pick it on purpose. Undefined means nothing is preselected.
export const pickDefaultGrocer = ({
  available,
  remembered,
  krogerNearby,
}: DefaultInput): GrocerId | undefined => {
  if (remembered && available.includes(remembered)) return remembered
  if (krogerNearby && available.includes('kroger')) return 'kroger'
  if (available.includes('walmart')) return 'walmart'
  return undefined
}

export const isZip = (value: string): boolean => /^\d{5}$/.test(value)
