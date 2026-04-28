'use client'

import { useState, useEffect } from 'react'
import { X, User, Settings, ChevronDown, ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/lib/workspace'
import AccountSection from './settings/AccountSection'
import SecuritySection from './settings/SecuritySection'
import AppearanceSection from './settings/AppearanceSection'
import TradingDefaultsSection from './settings/TradingDefaultsSection'
import DataSection from './settings/DataSection'
import DangerSection from './settings/DangerSection'

type Section = 'account' | 'security' | 'appearance' | 'trading-defaults' | 'data' | 'danger'

interface SettingsModalProps {
  onClose: () => void
  initialSection?: Section
}

export default function SettingsModal({ onClose, initialSection = 'account' }: SettingsModalProps) {
  const { workspace } = useWorkspace()
  const isTrading = workspace?.type === 'trading'

  const [activeSection, setActiveSection] = useState<Section>(initialSection)
  const [profileOpen, setProfileOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (['account', 'security'].includes(initialSection)) {
      setProfileOpen(true)
      setSettingsOpen(false)
    } else {
      setProfileOpen(false)
      setSettingsOpen(true)
    }
  }, [initialSection])

  const profileSections: { key: Section; label: string }[] = [
    { key: 'account', label: 'Account' },
    { key: 'security', label: 'Security' },
  ]

  const settingsSections: { key: Section; label: string }[] = [
    { key: 'appearance', label: 'Appearance' },
    ...(isTrading ? [{ key: 'trading-defaults' as Section, label: 'Trading Defaults' }] : []),
    { key: 'data', label: 'Data' },
    { key: 'danger', label: 'Danger Zone' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl h-[80vh] flex overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Sidebar */}
        <div className="w-48 border-r border-border bg-sidebar p-3 flex flex-col flex-shrink-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-semibold text-foreground">Settings</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <nav className="flex flex-col gap-0.5">
            <button
              onClick={() => { setProfileOpen(!profileOpen); if (!profileOpen) setActiveSection('account') }}
              className="flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </div>
              {profileOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>
            {profileOpen && (
              <div className="ml-4 flex flex-col gap-0.5">
                {profileSections.map(s => (
                  <button key={s.key} onClick={() => setActiveSection(s.key)}
                    className={`px-2 py-1.5 rounded-md text-[12px] text-left transition-colors ${
                      activeSection === s.key ? 'bg-sidebar-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                    }`}>{s.label}</button>
                ))}
              </div>
            )}

            <button
              onClick={() => { setSettingsOpen(!settingsOpen); if (!settingsOpen) setActiveSection('appearance') }}
              className="flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] text-foreground hover:bg-sidebar-accent transition-colors mt-1"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </div>
              {settingsOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
            </button>
            {settingsOpen && (
              <div className="ml-4 flex flex-col gap-0.5">
                {settingsSections.map(s => (
                  <button key={s.key} onClick={() => setActiveSection(s.key)}
                    className={`px-2 py-1.5 rounded-md text-[12px] text-left transition-colors ${
                      activeSection === s.key
                        ? s.key === 'danger' ? 'bg-destructive/10 text-destructive font-medium' : 'bg-sidebar-accent text-foreground font-medium'
                        : s.key === 'danger' ? 'text-destructive/70 hover:bg-destructive/10 hover:text-destructive' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                    }`}>{s.label}</button>
                ))}
              </div>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeSection === 'account' && <AccountSection />}
          {activeSection === 'security' && <SecuritySection />}
          {activeSection === 'appearance' && <AppearanceSection />}
          {activeSection === 'trading-defaults' && <TradingDefaultsSection />}
          {activeSection === 'data' && <DataSection />}
          {activeSection === 'danger' && <DangerSection />}
        </div>
      </div>
    </div>
  )
}