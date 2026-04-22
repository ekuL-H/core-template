'use client'

import { useState, useEffect, useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Plus, X, Settings, LayoutDashboard } from 'lucide-react'
import { useWorkspace } from '@/lib/workspace'

// Trading widgets (only imported for trading workspaces)
import { WidgetConfig, AVAILABLE_WIDGETS, DEFAULT_LAYOUT } from '@/components/trading/dashboard/types'
import {
  AccountWidget,
  PositionsWidget,
  CalendarWidget,
  WatchlistWidget,
  AIStatusWidget,
  QuickActionsWidget
} from '@/components/trading/dashboard/widgets'

// @ts-ignore
const GridLayout = require('react-grid-layout').default || require('react-grid-layout')

const TRADING_WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  'account': AccountWidget,
  'positions': PositionsWidget,
  'calendar': CalendarWidget,
  'watchlist': WatchlistWidget,
  'ai-status': AIStatusWidget,
  'quick-actions': QuickActionsWidget,
}

const STORAGE_KEY = 'dashboard_widgets'
const ROW_HEIGHT = 180

function getStorageKey(workspaceId?: string): string {
  return workspaceId ? `${STORAGE_KEY}_${workspaceId}` : STORAGE_KEY
}

export default function DashboardPage() {
  const { workspace } = useWorkspace()
  const isTrading = workspace?.type === 'trading'

  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_LAYOUT
    try {
      const saved = localStorage.getItem(getStorageKey(workspace?.id))
      if (saved) return JSON.parse(saved)
    } catch {}
    return isTrading ? DEFAULT_LAYOUT : []
  })
  const [editing, setEditing] = useState(false)
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    localStorage.setItem(getStorageKey(workspace?.id), JSON.stringify(widgets))
  }, [widgets, workspace?.id])

  useEffect(() => {
    const updateWidth = () => {
      const el = document.getElementById('dashboard-grid')
      if (el) setContainerWidth(el.clientWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const layout = useMemo(() => widgets.map(w => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    minW: 1,
    maxW: 3,
    minH: 1,
    maxH: 2,
    static: !editing,
  })), [widgets, editing])

  const handleLayoutChange = (newLayout: any[]) => {
    setWidgets(prev => prev.map(widget => {
      const item = newLayout.find((l: any) => l.i === widget.id)
      if (!item) return widget
      return { ...widget, x: item.x, y: item.y, w: item.w, h: item.h }
    }))
  }

  const addWidget = (type: string) => {
    const def = AVAILABLE_WIDGETS.find(w => w.type === type)
    if (!def) return
    const maxY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0)
    setWidgets(prev => [...prev, {
      id: `w_${Date.now()}`,
      type,
      x: 0,
      y: maxY,
      w: def.defaultW,
      h: def.defaultH,
    }])
    setShowAddWidget(false)
  }

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
  }

  const widgetComponents = isTrading ? TRADING_WIDGET_COMPONENTS : {}
  const availableWidgets = isTrading ? AVAILABLE_WIDGETS : []

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        {isTrading && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                editing ? 'border-primary text-primary bg-primary/10' : 'border-input text-muted-foreground hover:bg-accent'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              {editing ? 'Done' : 'Customise'}
            </button>
            {editing && (
              <button
                onClick={() => setShowAddWidget(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Widget
              </button>
            )}
          </div>
        )}
      </div>

      {/* Non-trading placeholder */}
      {!isTrading && (
        <div className="text-center py-20">
          <LayoutDashboard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            {workspace?.name} Dashboard
          </p>
          <p className="text-xs text-muted-foreground/60">Widgets for this workspace coming soon</p>
        </div>
      )}

      {/* Trading widget grid */}
      {isTrading && (
        <div id="dashboard-grid">
          {containerWidth > 0 && (
            <GridLayout
              className="layout"
              layout={layout}
              cols={3}
              rowHeight={ROW_HEIGHT}
              width={containerWidth}
              margin={[12, 12]}
              isDraggable={editing}
              isResizable={editing}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".widget-drag-handle"
              resizeHandles={['se']}
              compactType="vertical"
              useCSSTransforms={true}
            >
              {widgets.map(widget => {
                const Component = widgetComponents[widget.type]
                if (!Component) return null

                return (
                  <div
                    key={widget.id}
                    className={`rounded-lg border bg-card overflow-hidden transition-shadow ${
                      editing ? 'ring-1 ring-primary/20 border-primary/30' : 'border-border'
                    }`}
                  >
                    {editing && (
                      <div className="widget-drag-handle flex items-center justify-between px-3 py-1 bg-muted/30 cursor-grab active:cursor-grabbing border-b border-border/50">
                        <div className="flex items-center gap-1.5">
                          <div className="flex flex-col gap-0.5">
                            <div className="w-4 h-0.5 rounded-full bg-muted-foreground/30" />
                            <div className="w-4 h-0.5 rounded-full bg-muted-foreground/30" />
                          </div>
                          <span className="text-[9px] text-muted-foreground">
                            {AVAILABLE_WIDGETS.find(w => w.type === widget.type)?.label}
                          </span>
                        </div>
                        <button
                          onClick={() => removeWidget(widget.id)}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="p-0.5 rounded hover:bg-destructive/10"
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </button>
                      </div>
                    )}
                    <div className={`${editing ? 'h-[calc(100%-28px)]' : 'h-full'} p-3 overflow-hidden`}>
                      <Component />
                    </div>
                  </div>
                )
              })}
            </GridLayout>
          )}
        </div>
      )}

      {/* Need the div for width measurement even when not trading */}
      {!isTrading && <div id="dashboard-grid" />}

      {showAddWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-sm font-semibold text-popover-foreground mb-4">Add Widget</h2>
            <div className="space-y-2">
              {availableWidgets.map((w: any) => {
                const alreadyAdded = widgets.some(existing => existing.type === w.type)
                return (
                  <button
                    key={w.type}
                    onClick={() => !alreadyAdded && addWidget(w.type)}
                    disabled={alreadyAdded}
                    className={`w-full flex items-center justify-between p-3 rounded-md text-left transition-colors ${
                      alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{w.label}</p>
                      <p className="text-xs text-muted-foreground">{w.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{w.defaultW}x{w.defaultH}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowAddWidget(false)} className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent">Close</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}