'use client'

import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
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
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="min-h-screen bg-black/10 dark:bg-zinc-950">
      <Header sidebarExpanded={expanded} />
      <Sidebar expanded={expanded} onToggle={() => setExpanded(!expanded)} />
      <main
        className={`transition-all duration-300 pt-[35px] ${
          expanded ? 'ml-56' : 'ml-14'
        }`}
      >
        {/* Breadcrumb area - vertically centered between header (y-35) and divider (y-70) */}
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
      </main>
    </div>
  )
}