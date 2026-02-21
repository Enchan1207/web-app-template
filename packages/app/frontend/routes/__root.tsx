import Header from '@frontend/components/layout/header'
import Sidebar from '@frontend/components/layout/sidebar'
import { SidebarInset, SidebarProvider } from '@frontend/components/ui/sidebar'
import { Toaster } from '@frontend/components/ui/sonner'
import { TooltipProvider } from '@frontend/components/ui/tooltip'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

const RootLayout = () => {
  return (
    <SidebarProvider defaultOpen>
      <TooltipProvider>
        <div className="flex min-h-dvh w-full flex-col bg-muted/30">
          <Header />
          <div className="flex min-h-0 flex-1">
            <Sidebar />

            <SidebarInset>
              <main className="mx-auto min-w-0 w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </div>
        <Toaster />
        <TanStackRouterDevtools />
      </TooltipProvider>
    </SidebarProvider>
  )
}

export const Route = createRootRoute({ component: RootLayout })
