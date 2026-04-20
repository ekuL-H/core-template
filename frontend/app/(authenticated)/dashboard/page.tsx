'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { Plus, X, GripVertical, Settings } from 'lucide-react'
import { WidgetConfig, AVAILABLE_WIDGETS, DEFAULT_LAYOUT } from '@/components/trading/dashboard/types'
import {
  AccountWidget,
  PositionsWidget,
  CalendarWidget,
  WatchlistWidget,
  AIStatusWidget,
  QuickActionsWidget
} from '@/components/trading/dashboard/widgets'

const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  'account': AccountWidget,
  'positions': PositionsWidget,
  'calendar': CalendarWidget,
  'watchlist': WatchlistWidget,
  'ai-status': AIStatusWidget,
  'quick-actions': QuickActionsWidget,
}

const STORAGE_KEY = 'dashboard_layout'

function loadLayout(): WidgetConfig[] {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return DEFAULT_LAYOUT
}

function saveLayout(layout: WidgetConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
}

export default function DashboardPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => loadLayout())
  const [editing, setEditing] = useState(false)
  const [showAddWidget, setShowAddWidget] = useState(false)

  useEffect(() => { saveLayout(widgets) }, [widgets])

  const addWidget = (type: string) => {
    const def = AVAILABLE_WIDGETS.find(w => w.type === type)
    if (!def) return
    const newWidget: WidgetConfig = {
      id: `w_${Date.now()}`,
      type,
      width: def.defaultWidth as 1 | 2 | 3,
      height: def.defaultHeight as 1 | 2,
    }
    setWidgets(prev => [...prev, newWidget])
    setShowAddWidget(false)
  }

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id))
  }

  const cycleSize = (id: string) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w
      // Cycle through sizes: 1x1 → 2x1 → 3x1 → 1x2 → 2x2 → 1x1
      const sizes: [number, number][] = [[1, 1], [2, 1], [3, 1], [1, 2], [2, 2]]
      const current = sizes.findIndex(([w2, h]) => w2 === w.width && h === w.height)
      const next = sizes[(current + 1) % sizes.length]
      return { ...w, width: next[0] as 1 | 2 | 3, height: next[1] as 1 | 2 }
    }))
  }

  const ROW_HEIGHT = 180

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
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
      </div>

      {/* Widget grid */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: `${ROW_HEIGHT}px` }}
      >
        {widgets.map(widget => {
          const Component = WIDGET_COMPONENTS[widget.type]
          if (!Component) return null

          return (
            <div
              key={widget.id}
              className={`relative rounded-lg border border-border bg-card p-3 overflow-hidden transition-all ${
                editing ? 'ring-1 ring-primary/20' : ''
              }`}
              style={{
                gridColumn: `span ${widget.width}`,
                gridRow: `span ${widget.height}`,
              }}
            >
              {editing && (
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
                  <button
                    onClick={() => cycleSize(widget.id)}
                    className="p-1 rounded bg-card border border-border hover:bg-accent text-[9px] text-muted-foreground"
                    title="Resize"
                  >
                    {widget.width}x{widget.height}
                  </button>
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="p-1 rounded bg-card border border-border hover:bg-destructive/10"
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              )}
              <Component />
            </div>
          )
        })}
      </div>

      {/* Add widget modal */}
      {showAddWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-popover rounded-lg border border-border p-6 w-full max-w-md mx-4">
            <h2 className="text-sm font-semibold text-popover-foreground mb-4">Add Widget</h2>
            <div className="space-y-2">
              {AVAILABLE_WIDGETS.map(w => {
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
                    <span className="text-[10px] text-muted-foreground">{w.defaultWidth}x{w.defaultHeight}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowAddWidget(false)} className="px-3 py-1.5 text-xs rounded-md text-muted-foreground hover:bg-accent">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}