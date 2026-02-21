import {
  Sidebar as AppSidebarContainer,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@frontend/components/ui/sidebar'
import { useUser } from '@frontend/hooks/use-user'
import { Link, useRouterState } from '@tanstack/react-router'

import { filterNavItemsByAuth, navItems } from './nav-items'

const isPathActive = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`)

const Sidebar: React.FC = () => {
  const userQuery = useUser()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isAuthenticated =
    userQuery.data !== undefined && userQuery.data !== null
  const visibleNavItems = filterNavItemsByAuth(navItems, isAuthenticated)

  return (
    <AppSidebarContainer
      collapsible="icon"
      className="top-14 h-[calc(100svh-3.5rem)] md:top-16 md:h-[calc(100svh-4rem)]"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isPathActive(pathname, item.to)}
                    tooltip={item.label}
                  >
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </AppSidebarContainer>
  )
}

export default Sidebar
