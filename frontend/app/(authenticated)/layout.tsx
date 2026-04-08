'use client'

import { useState } from 'react'
import AuthProvider from '@/components/providers/AuthProvider'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import Breadcrumb from '@/components/layout/Breadcrumb'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-black/10 dark:bg-zinc-950">
        <Header sidebarExpanded={expanded} />
        <Sidebar expanded={expanded} onToggle={() => setExpanded(!expanded)} />
        <main
          className={`transition-all duration-300 pt-[35px] ${
            expanded ? 'ml-56' : 'ml-14'
          }`}
        >
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}