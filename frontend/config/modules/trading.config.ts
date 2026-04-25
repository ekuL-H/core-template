import {
  LayoutDashboard,
  LineChart,
  List,
  FlaskConical,
  BookOpen,
  BarChart2,
  Bot,
  Activity,
} from 'lucide-react'

export const tradingConfig = {
  module: 'trading',
  name: 'Trading Platform',
  sidebar: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Charts', href: '/trading/charts', icon: LineChart },
    { label: 'Watchlist', href: '/trading/watchlist', icon: List },
    { label: 'Backtesting', href: '/trading/backtesting', icon: FlaskConical },
    { label: 'Journal', href: '/trading/journal', icon: BookOpen },
    { label: 'Analytics', href: '/trading/analytics', icon: BarChart2 },
    { label: 'AI Labs', href: '/trading/ai-labs', icon: Bot },
    { label: 'Automation', href: '/trading/automation', icon: Activity },
  ]
}