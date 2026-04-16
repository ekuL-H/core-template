'use client'

import { useState } from 'react'
import AuthProvider from '@/components/providers/AuthProvider'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <AuthProvider>
      <div className="h-screen overflow-hidden bg-background">
        <Header sidebarExpanded={expanded} />
        <Sidebar expanded={expanded} onToggle={() => setExpanded(!expanded)} />
        <main
          className={`transition-all duration-300 pt-11 h-full ${
            expanded ? 'ml-56' : 'ml-14'
          }`}
        >
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}