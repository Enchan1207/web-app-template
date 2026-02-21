import type { FileRouteTypes } from '@frontend/routeTree.gen'
import { File, Home, Lock } from 'lucide-react'

export type NavVisibility = 'public' | 'authenticated'

export type NavItem = {
  to: FileRouteTypes['to']
  label: string
  icon: React.ComponentType<{ className?: string }>
  visibility: NavVisibility
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, visibility: 'public' },
  { to: '/about', label: 'About', icon: File, visibility: 'public' },
  {
    to: '/secret',
    label: 'Secret',
    icon: Lock,
    visibility: 'authenticated',
  },
]

export const filterNavItemsByAuth = (
  items: NavItem[],
  isAuthenticated: boolean,
): NavItem[] =>
  items.filter((item) =>
    item.visibility === 'authenticated' ? isAuthenticated : true,
  )
