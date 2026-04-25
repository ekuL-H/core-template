'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Moon, Sun, LogOut } from 'lucide-react'
import { useWorkspace } from '@/lib/workspace'
import { logout } from '@/lib/auth'

interface SidebarProps {
  expanded: boolean
  onToggle: () => void
  onOpenSettings?: (section: 'account' | 'appearance') => void
}

export default function Sidebar({ expanded, onToggle, onOpenSettings }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { moduleConfig } = useWorkspace()
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

  return (
    <aside
      className={`fixed top-11 left-0 bottom-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        expanded ? 'w-56' : 'w-14'
      }`}
    >
      {/* Toggle + Quick Access area */}
      <div className="flex-shrink-0 border-b border-sidebar-border">
        <div className="flex items-center justify-end p-2">
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-sidebar-accent transition-colors"
          >
            {expanded ? (
              <ChevronLeft className="w-4 h-4 text-sidebar-foreground/70" />
            ) : (
              <ChevronRight className="w-4 h-4 text-sidebar-foreground/70" />
            )}
          </button>
        </div>

        <div className="px-2 pb-2">
          <div className="rounded-md border border-sidebar-border bg-sidebar-accent/50 h-40">
            {expanded ? (
              <div className="flex flex-col h-full p-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Quick Access
                </span>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-[11px] text-muted-foreground/60">
                    Pin pages or widgets here
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1">
                <div className="w-5 h-0.5 rounded-full bg-muted-foreground/30" />
                <div className="w-5 h-0.5 rounded-full bg-muted-foreground/30" />
                <div className="w-5 h-0.5 rounded-full bg-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 p-2 flex-1 min-h-0 overflow-y-auto justify-center">
        {moduleConfig.sidebar.map((item: any) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          // Intercept Profile and Settings to open modal instead
          if (item.href === '/profile' && onOpenSettings) {
            return (
              <button
                key={item.href}
                onClick={() => onOpenSettings('account')}
                className={`flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-[13px] w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {expanded && <span className="truncate">{item.label}</span>}
              </button>
            )
          }

          if (item.href === '/settings' && onOpenSettings) {
            return (
              <button
                key={item.href}
                onClick={() => onOpenSettings('appearance')}
                className={`flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-[13px] w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {expanded && <span className="truncate">{item.label}</span>}
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-[13px] ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {expanded && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: dark mode + logout */}
      <div className="flex-shrink-0 border-t border-sidebar-border p-2">
        <div className={`flex ${expanded ? 'flex-col gap-1' : 'flex-col items-center gap-1'}`}>
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {darkMode ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
            {expanded && <span className="truncate">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-2 py-2 rounded-md transition-colors text-[13px] text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {expanded && <span className="truncate">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}