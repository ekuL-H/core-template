'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Search, Bell, Calendar, HelpCircle, ChevronDown } from 'lucide-react'
import { useTabs } from '@/lib/tabs'
import { useWorkspace } from '@/lib/workspace'
import { coreApi } from '@/lib/api/core'
import LoadingScreen from '@/components/layout/LoadingScreen'
import TabBar from '@/components/layout/TabBar'

interface HeaderProps {
  sidebarExpanded: boolean
}

const TYPE_COLORS: Record<string, string> = {
  trading: '#5C899D',
  property: '#6C7D36',
  business: '#A0430A',
}

export default function Header({ sidebarExpanded }: HeaderProps) {
  const { goBack, goForward, canGoBack, canGoForward } = useTabs()
  const { workspace, setWorkspace } = useWorkspace()
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    coreApi.getWorkspaces().then(setWorkspaces).catch(() => {})
  }, [])

  const handleSwitchWorkspace = (ws: any) => {
    coreApi.openWorkspace(ws.id).catch(() => {})
    setWorkspace({ id: ws.id, type: ws.type, name: ws.name })
    setShowWorkspaceDropdown(false)
    setSwitching(true)
    setTimeout(() => {
      try {
        const saved = localStorage.getItem(`browser_tabs_${ws.id}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          const activeTab = parsed.tabs?.find((t: any) => t.id === parsed.activeTabId)
          if (activeTab?.route) { window.location.href = activeTab.route; return }
        }
      } catch {}
      window.location.href = '/dashboard'
    }, 100)
  }

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 h-11 flex items-stretch bg-sidebar border-b border-sidebar-border">
      {/* Logo + Workspace */}
      <div className="flex items-stretch border-r border-sidebar-border flex-shrink-0 w-56">
        <div
          onClick={() => { setSwitching(true); setTimeout(() => { window.location.href = '/workspaces' }, 100) }}
          className="w-14 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-[7px] font-bold text-background tracking-tight">Oasis</span>
          </div>
        </div>

        <div className="flex items-center flex-1 min-w-0 pr-3 relative">
          <button
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="flex items-center justify-between px-2 py-1 rounded-md text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors w-full min-w-0 border border-border"
          >
            <span className="truncate">{workspace?.name || 'Workspace'}</span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-60 ml-1" />
          </button>
          {showWorkspaceDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowWorkspaceDropdown(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-md shadow-lg py-1 w-full min-w-[180px]">
                {workspaces.filter((ws: any) => ws.status === 'active').map((ws: any) => (
                  <button key={ws.id} onClick={() => handleSwitchWorkspace(ws)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center gap-2 ${
                      ws.id === workspace?.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[ws.type] || '#5C899D' }} />
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={() => { setShowWorkspaceDropdown(false); setSwitching(true); setTimeout(() => { window.location.href = '/workspaces' }, 100) }}
                    className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
                  >Manage workspaces...</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Navigation + Tabs */}
      <div className="flex items-center flex-1 px-2 gap-1 min-w-0">
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button onClick={goBack} disabled={!canGoBack}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent" title="Back">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={goForward} disabled={!canGoForward}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent" title="Forward">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />

        <TabBar />
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-0.5 px-2 border-l border-sidebar-border flex-shrink-0">
        <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Search">
          <Search className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Notifications">
          <Bell className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Calendar">
          <Calendar className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" title="Help">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
    {switching && <LoadingScreen />}
    </>
  )
}