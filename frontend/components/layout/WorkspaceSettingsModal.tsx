'use client'

import { useState } from 'react'
import { X, Settings, Users, Shield, Database, AlertTriangle } from 'lucide-react'
import { useWorkspace } from '@/lib/workspace'
import GeneralSection from './workspace-settings/GeneralSection'
import MembersSection from './workspace-settings/MembersSection'
import DataSection from './workspace-settings/DataSection'
import DangerSection from './workspace-settings/DangerSection'

type Section = 'general' | 'members' | 'data' | 'danger'

interface WorkspaceSettingsModalProps {
  onClose: () => void
}

export default function WorkspaceSettingsModal({ onClose }: WorkspaceSettingsModalProps) {
  const { workspace } = useWorkspace()
  const [activeSection, setActiveSection] = useState<Section>('general')

  const sections: { key: Section; label: string; icon: any; danger?: boolean }[] = [
    { key: 'general', label: 'General', icon: Settings },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'data', label: 'Data', icon: Database },
    { key: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl h-[80vh] flex overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Sidebar */}
        <div className="w-48 border-r border-border bg-sidebar p-3 flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-semibold text-foreground">Workspace Settings</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="px-2 mb-3">
            <p className="text-[11px] text-muted-foreground truncate">{workspace?.name}</p>
          </div>

          <nav className="flex flex-col gap-0.5">
            {sections.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-left transition-colors ${
                  activeSection === s.key
                    ? s.danger ? 'bg-destructive/10 text-destructive font-medium' : 'bg-sidebar-accent text-foreground font-medium'
                    : s.danger ? 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                }`}
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeSection === 'general' && <GeneralSection />}
          {activeSection === 'members' && <MembersSection />}
          {activeSection === 'data' && <DataSection />}
          {activeSection === 'danger' && <DangerSection />}
        </div>
      </div>
    </div>
  )
}