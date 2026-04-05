import {
  LayoutDashboard,
  LineChart,
  List,
  FlaskConical,
  BookOpen,
  BarChart2,
  Bot,
  User,
  Activity,
  Settings
} from 'lucide-react'

export const tradingConfig = {
  module: 'trading',
  name: 'Trading Platform',
  sidebar: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Charts', href: '/charts', icon: LineChart },
    { label: 'Watchlist', href: '/watchlist', icon: List },
    { label: 'Backtesting', href: '/backtesting', icon: FlaskConical },
    { label: 'Journal', href: '/journal', icon: BookOpen },
    { label: 'Analytics', href: '/analytics', icon: BarChart2 },
    { label: 'AI Labs', href: '/ai-labs', icon: Bot },
    { label: 'Automation', href: '/automation', icon: Activity },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
  ]
}