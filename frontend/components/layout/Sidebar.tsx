'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { moduleConfig } from '@/config'

interface SidebarProps {
  expanded: boolean
  onToggle: () => void
}

export default function Sidebar({ expanded, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`fixed top-11 left-0 bottom-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        expanded ? 'w-56' : 'w-14'
      }`}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-end p-2 border-b border-sidebar-border">
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

      {/* Nav Items */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {moduleConfig.sidebar.map((item: any) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors text-[13px] ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {expanded && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}