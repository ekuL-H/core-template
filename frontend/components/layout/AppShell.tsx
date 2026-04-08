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
    <>
      {/* Breadcrumb area */}
      <div className="h-[35px] flex items-center px-6">
        <Breadcrumb overrides={breadcrumbOverrides} />
      </div>
      {/* Divider */}
      <div className="mx-6">
        <div className="h-px bg-black/10 dark:bg-white/10" />
      </div>
      {/* Page content */}
      <div className="p-6">
        {children}
      </div>
    </>
  )
}