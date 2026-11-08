import type { NavItem } from '@/components/organisms'

// The public site
export const SITE_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', hideOnMobile: true },
]

// The signed-in part of the site: same header, its own links. Meal planning and goals will
// join these as they are built.
export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { id: 'account', label: 'My account', href: '/profile' },
  { id: 'manage', label: 'Manage recipes', href: '/admin', ownerOnly: true },
]
