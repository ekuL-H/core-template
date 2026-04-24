export interface WidgetConfig {
  id: string
  type: string
  x: number
  y: number
  w: number  // columns (1-3)
  h: number  // rows (1-3)
}

export interface WidgetDef {
  type: string
  label: string
  defaultW: number
  defaultH: number
  maxH: number
  description: string
}

export const AVAILABLE_WIDGETS: WidgetDef[] = [
  { type: 'account', label: 'Account Overview', defaultW: 1, defaultH: 1, maxH: 2, description: 'Balance, equity, margin from MT5' },
  { type: 'positions', label: 'Open Positions', defaultW: 2, defaultH: 1, maxH: 3, description: 'Current trades from MT5' },
  { type: 'calendar', label: 'Economic Calendar', defaultW: 2, defaultH: 2, maxH: 3, description: 'Upcoming news events' },
  { type: 'watchlist', label: 'Watchlist', defaultW: 1, defaultH: 2, maxH: 3, description: 'Quick view of your symbols' },
  { type: 'ai-status', label: 'AI Status', defaultW: 1, defaultH: 1, maxH: 2, description: 'Models and recent activity' },
  { type: 'quick-actions', label: 'Quick Actions', defaultW: 1, defaultH: 1, maxH: 1, description: 'Shortcuts to common tasks' },
]

export const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'w1', type: 'account', x: 0, y: 0, w: 1, h: 1 },
  { id: 'w2', type: 'positions', x: 1, y: 0, w: 2, h: 1 },
  { id: 'w3', type: 'calendar', x: 0, y: 1, w: 2, h: 2 },
  { id: 'w4', type: 'watchlist', x: 2, y: 1, w: 1, h: 2 },
  { id: 'w5', type: 'ai-status', x: 0, y: 3, w: 1, h: 1 },
  { id: 'w6', type: 'quick-actions', x: 1, y: 3, w: 1, h: 1 },
]