'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Plus, Search, Bell, Calendar, HelpCircle, ChevronDown, X } from 'lucide-react'
import { useTabs } from '@/lib/tabs'
import { useWorkspace } from '@/lib/workspace'
import { coreApi } from '@/lib/api/core'

interface HeaderProps {
  sidebarExpanded: boolean
}

export default function Header({ sidebarExpanded }: HeaderProps) {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab, goBack, goForward, canGoBack, canGoForward } = useTabs()
  const { workspace, setWorkspace } = useWorkspace()
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false)
  const [workspaces, setWorkspaces] = useState<any[]>([])

  useEffect(() => {
    coreApi.getWorkspaces().then(setWorkspaces).catch(() => {})
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-11 flex items-stretch bg-sidebar border-b border-sidebar-border">
      {/* Logo + Workspace */}
      <div className="flex items-stretch border-r border-sidebar-border flex-shrink-0 w-56">
        {/* Logo - click to go to workspaces */}
        <div
          onClick={() => window.location.href = '/workspaces'}
          className="w-14 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center">
            <span className="text-[8px] font-bold text-background tracking-tight">T-AI</span>
          </div>
        </div>

        {/* Workspace switcher */}
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
                {workspaces.map((ws: any) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setWorkspace({ id: ws.id, type: ws.type, name: ws.name })
                      setShowWorkspaceDropdown(false)
                      window.location.href = '/dashboard'
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors ${
                      ws.id === workspace?.id ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {ws.name}
                  </button>
                ))}
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={() => { setShowWorkspaceDropdown(false); window.location.href = '/workspaces' }}
                    className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Manage workspaces...
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Browser-style navigation area */}
      <div className="flex items-center flex-1 px-2 gap-1 min-w-0">
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={goBack}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            disabled={!canGoBack}
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={goForward}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            disabled={!canGoForward}
            title="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />

        <div className="flex items-end gap-0.5 flex-1 min-w-0 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-1.5 px-3 py-1 text-[12px] max-w-[180px] min-w-[80px] rounded-t transition-colors relative ${
                tab.id === activeTabId
                  ? 'bg-background text-foreground border border-border border-b-background -mb-px z-10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <span className="truncate flex-1 text-left">{tab.title}</span>
              {tabs.length > 1 && (
                <span
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                  className={`flex-shrink-0 p-0.5 rounded hover:bg-muted transition-colors ${
                    tab.id === activeTabId ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 hover:opacity-100'
                  }`}
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => addTab()}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
            title="New tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
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
  )
}