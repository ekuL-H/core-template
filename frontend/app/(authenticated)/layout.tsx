'use client'

import { useState } from 'react'
import AuthProvider from '@/components/providers/AuthProvider'
import { TabsProvider } from '@/lib/tabs'
import { WorkspaceProvider } from '@/lib/workspace'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import SettingsModal from '@/components/layout/SettingsModal'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('sidebar_expanded')
    return saved !== null ? saved === 'true' : true
  })

  const [settingsModal, setSettingsModal] = useState<'account' | 'security' | 'appearance' | 'trading-defaults' | 'data' | 'danger' | null>(null)

  const handleToggle = () => {
    const next = !expanded
    setExpanded(next)
    localStorage.setItem('sidebar_expanded', String(next))
  }

  return (
    <AuthProvider>
      <WorkspaceProvider>
        <TabsProvider>
          <div className="h-screen overflow-hidden bg-background">
            <Header sidebarExpanded={expanded} />
            <Sidebar expanded={expanded} onToggle={handleToggle} onOpenSettings={setSettingsModal} />
            <main
              className={`transition-all duration-300 pt-11 h-full ${
                expanded ? 'ml-56' : 'ml-14'
              }`}
            >
              {children}
            </main>
          </div>

          {settingsModal && (
            <SettingsModal
              onClose={() => setSettingsModal(null)}
              initialSection={settingsModal}
            />
          )}
        </TabsProvider>
      </WorkspaceProvider>
    </AuthProvider>
  )
}