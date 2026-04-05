'use client'

import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
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
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}