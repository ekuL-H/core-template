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
    <div className="flex flex-col h-[calc(100vh-44px)]">
      {/* Breadcrumb area */}
      <div className="h-[35px] flex items-center px-6 flex-shrink-0">
        <Breadcrumb overrides={breadcrumbOverrides} />
      </div>
      {/* Divider */}
      <div className="mx-6 flex-shrink-0">
        <div className="h-px bg-border" />
      </div>
      {/* Page content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {children}
      </div>
    </div>
  )
}