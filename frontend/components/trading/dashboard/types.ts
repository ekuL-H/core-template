export interface WidgetConfig {
  id: string
  type: string
  width: 1 | 2 | 3  // columns wide
  height: 1 | 2      // rows tall
}

export const AVAILABLE_WIDGETS = [
  { type: 'account', label: 'Account Overview', defaultWidth: 1, defaultHeight: 1, description: 'Balance, equity, margin from MT5' },
  { type: 'positions', label: 'Open Positions', defaultWidth: 2, defaultHeight: 1, description: 'Current trades from MT5' },
  { type: 'calendar', label: 'Economic Calendar', defaultWidth: 2, defaultHeight: 2, description: 'Upcoming news events' },
  { type: 'watchlist', label: 'Watchlist', defaultWidth: 1, defaultHeight: 2, description: 'Quick view of your symbols' },
  { type: 'ai-status', label: 'AI Status', defaultWidth: 1, defaultHeight: 1, description: 'Models and recent activity' },
  { type: 'quick-actions', label: 'Quick Actions', defaultWidth: 1, defaultHeight: 1, description: 'Shortcuts to common tasks' },
] as const

export const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'w1', type: 'account', width: 1, height: 1 },
  { id: 'w2', type: 'positions', width: 2, height: 1 },
  { id: 'w3', type: 'calendar', width: 2, height: 2 },
  { id: 'w4', type: 'watchlist', width: 1, height: 2 },
  { id: 'w5', type: 'ai-status', width: 1, height: 1 },
  { id: 'w6', type: 'quick-actions', width: 1, height: 1 },
]