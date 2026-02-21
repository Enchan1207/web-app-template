import { SidebarTrigger } from '@frontend/components/ui/sidebar'

import AccountMenu from '../account/account-menu'
import ThemeToggle from '../theme/theme-toggle'

const Header: React.FC = () => {
  return (
    <header className="bg-accent relative z-20 w-full p-2 shadow md:p-4">
      <div className="flex flex-row items-center">
        <SidebarTrigger className="mr-1 h-8 w-8" />
        <div className="flex-1 text-base font-semibold md:text-xl">
          Web application template
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <ThemeToggle />
          <AccountMenu />
        </div>
      </div>
    </header>
  )
}

export default Header
