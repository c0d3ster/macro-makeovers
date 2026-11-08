import type { NavItem } from '@/components/organisms'

// The list only, not the barrel: the barrel also reads the guide files from disk
import { GUIDES } from '@/libs/guides/guideList'

// The public site
export const SITE_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', hideOnMobile: true },
  { id: 'recipes', label: 'Recipes', href: '/recipes' },
  {
    id: 'guides',
    label: 'Guides',
    href: '/guides',
    children: GUIDES.map(({ slug, title }) => ({
      label: title,
      href: `/guides/${slug}`,
    })),
  },
  // Phones run out of header room, and the home page links to About
  { id: 'about', label: 'About', href: '/about', hideOnMobile: true },
]

// The signed-in part of the site: same header, its own links. Meal planning and goals will
// join these as they are built.
export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { id: 'account', label: 'My account', href: '/profile' },
  { id: 'manage', label: 'Manage recipes', href: '/admin', ownerOnly: true },
]
