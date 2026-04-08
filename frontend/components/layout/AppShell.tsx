'use client'

import Breadcrumb from './Breadcrumb'

interface BreadcrumbOverride {
  label: string
  href?: string
}

interface AppShellProps {
  children: React.ReactNode
  breadcrumbOverrides?: BreadcrumbOverride[]
}

export default function AppShell({ children, breadcrumbOverrides }: AppShellProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-35px)]">
      {/* Breadcrumb area - fixed at top */}
      <div className="h-[35px] flex items-center px-6 flex-shrink-0">
        <Breadcrumb overrides={breadcrumbOverrides} />
      </div>
      {/* Divider */}
      <div className="mx-6 flex-shrink-0">
        <div className="h-px bg-black/10 dark:bg-white/10" />
      </div>
      {/* Page content - scrolls independently */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {children}
      </div>
    </div>
  )
}