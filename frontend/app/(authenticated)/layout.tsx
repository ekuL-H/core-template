'use client'

import { useState } from 'react'
import AuthProvider from '@/components/providers/AuthProvider'
import { TabsProvider } from '@/lib/tabs'
import { WorkspaceProvider } from '@/lib/workspace'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import SettingsModal from '@/components/layout/SettingsModal'
import WorkspaceSettingsModal from '@/components/layout/WorkspaceSettingsModal'

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

  const [settingsModal, setSettingsModal] = useState<'user' | 'workspace' | null>(null)

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

          {settingsModal === 'user' && (
            <SettingsModal
              onClose={() => setSettingsModal(null)}
            />
          )}
          {settingsModal === 'workspace' && (
            <WorkspaceSettingsModal
              onClose={() => setSettingsModal(null)}
            />
          )}
        </TabsProvider>
      </WorkspaceProvider>
    </AuthProvider>
  )
}