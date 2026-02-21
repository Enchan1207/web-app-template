import { createContext, useContext, useState } from 'react'

type SidebarContextType = {
  isOpen: boolean
  isCollapsed: boolean
  setIsOpen: (open: boolean) => void
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <SidebarContext.Provider
      value={{ isOpen, isCollapsed, setIsOpen, toggleCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
