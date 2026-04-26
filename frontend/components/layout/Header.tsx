'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, ArrowRight, Plus, Search, Bell, Calendar, HelpCircle, ChevronDown, X } from 'lucide-react'
import { useTabs } from '@/lib/tabs'
import { useWorkspace } from '@/lib/workspace'
import { coreApi } from '@/lib/api/core'
import LoadingScreen from '@/components/layout/LoadingScreen'

interface HeaderProps {
  sidebarExpanded: boolean
}

export default function Header({ sidebarExpanded }: HeaderProps) {
  const { tabs, activeTabId, setActiveTab, addTab, closeTab, goBack, goForward, canGoBack, canGoForward, reorderTabs } = useTabs()
  const { workspace, setWorkspace } = useWorkspace()
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [switching, setSwitching] = useState(false)

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])
  const tabContainerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startScrollRef = useRef(0)

  useEffect(() => {
    coreApi.getWorkspaces().then(setWorkspaces).catch(() => {})
  }, [])

  const getTabWidths = useCallback(() => {
    return tabRefs.current.map(ref => ref?.offsetWidth || 0)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    // Don't start drag on close button
    if ((e.target as HTMLElement).closest('.tab-close')) return

    e.preventDefault()
    startXRef.current = e.clientX
    setDragIndex(index)
    setDragOffset(0)
    setHoverIndex(index)

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current
      setDragOffset(delta)

      // Calculate which position the tab should be in
      const widths = getTabWidths()
      let accumulated = 0
      let newIndex = index

      if (delta > 0) {
        // Moving right
        for (let i = index + 1; i < widths.length; i++) {
          accumulated += widths[i]
          if (delta > accumulated - widths[i] / 2) {
            newIndex = i
          } else break
        }
      } else {
        // Moving left
        for (let i = index - 1; i >= 0; i--) {
          accumulated -= widths[i]
          if (delta < accumulated + widths[i] / 2) {
            newIndex = i
          } else break
        }
      }

      setHoverIndex(newIndex)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      if (hoverIndex !== null && dragIndex !== null && hoverIndex !== dragIndex) {
        reorderTabs(dragIndex, hoverIndex)
      }

      setDragIndex(null)
      setDragOffset(0)
      setHoverIndex(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [dragIndex, hoverIndex, getTabWidths, reorderTabs])

  // Need to use a ref for hoverIndex in mouseup since it's stale in closure
  const hoverIndexRef = useRef<number | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  useEffect(() => { hoverIndexRef.current = hoverIndex }, [hoverIndex])
  useEffect(() => { dragIndexRef.current = dragIndex }, [dragIndex])

  const handleMouseDownStable = useCallback((e: React.MouseEvent, index: number) => {
    if ((e.target as HTMLElement).closest('.tab-close')) return

    e.preventDefault()
    startXRef.current = e.clientX
    setDragIndex(index)
    setDragOffset(0)
    setHoverIndex(index)

    const widths = getTabWidths()

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current
      setDragOffset(delta)

      let newIndex = index

      if (delta > 0) {
        let accumulated = 0
        for (let i = index + 1; i < widths.length; i++) {
          accumulated += widths[i]
          if (delta > accumulated - widths[i] / 2) newIndex = i
          else break
        }
      } else {
        let accumulated = 0
        for (let i = index - 1; i >= 0; i--) {
          accumulated -= widths[i]
          if (delta < accumulated + widths[i] / 2) newIndex = i
          else break
        }
      }

      setHoverIndex(newIndex)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      const finalHover = hoverIndexRef.current
      const finalDrag = dragIndexRef.current

      if (finalHover !== null && finalDrag !== null && finalHover !== finalDrag) {
        reorderTabs(finalDrag, finalHover)
      }

      setDragIndex(null)
      setDragOffset(0)
      setHoverIndex(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [getTabWidths, reorderTabs])

  const getTabStyle = (index: number): React.CSSProperties => {
    if (dragIndex === null) return {}

    // The tab being dragged
    if (index === dragIndex) {
      return {
        transform: `translateX(${dragOffset}px)`,
        zIndex: 50,
        opacity: 0.9,
        transition: 'none',
      }
    }

    // Other tabs shift to make room
    if (hoverIndex !== null && hoverIndex !== dragIndex) {
      const dragWidth = tabRefs.current[dragIndex]?.offsetWidth || 0

      if (dragIndex < hoverIndex) {
        // Dragging right: tabs between drag and hover shift left
        if (index > dragIndex && index <= hoverIndex) {
          return { transform: `translateX(-${dragWidth + 2}px)`, transition: 'transform 150ms ease' }
        }
      } else {
        // Dragging left: tabs between hover and drag shift right
        if (index >= hoverIndex && index < dragIndex) {
          return { transform: `translateX(${dragWidth + 2}px)`, transition: 'transform 150ms ease' }
        }
      }
    }

    return { transition: 'transform 150ms ease' }
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
                {workspaces.map((ws: any) => (
                  <button
                    key={ws.id}
                    onClick={() => {
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
                    onClick={() => { setShowWorkspaceDropdown(false); setSwitching(true); setTimeout(() => { window.location.href = '/workspaces' }, 100) }}
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

        {/* Tabs */}
        <div ref={tabContainerRef} className="flex items-end gap-0.5 flex-1 min-w-0 overflow-x-auto no-scrollbar relative">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              ref={el => { tabRefs.current[index] = el }}
              onMouseDown={(e) => handleMouseDownStable(e, index)}
              onClick={() => { if (dragIndex === null) setActiveTab(tab.id) }}
              style={getTabStyle(index)}
              className={`group flex items-center gap-1.5 px-3 py-1 text-[12px] max-w-[180px] min-w-[80px] rounded-t transition-colors relative select-none ${
                tab.id === activeTabId
                  ? 'bg-background text-foreground border border-border border-b-background -mb-px z-10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              } ${dragIndex === index ? 'cursor-grabbing shadow-lg' : 'cursor-pointer'}`}
            >
              <span className="truncate flex-1 text-left pointer-events-none">{tab.title}</span>
              {tabs.length > 1 && (
                <span
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                  className={`tab-close flex-shrink-0 p-0.5 rounded hover:bg-muted transition-colors ${
                    tab.id === activeTabId ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 hover:opacity-100'
                  }`}
                >
                  <X className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
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
    {switching && <LoadingScreen />}
    </>
  )
}