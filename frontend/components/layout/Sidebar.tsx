'use client'

import { useState } from 'react'
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
      className={`fixed top-[35px] left-0 bottom-0 z-40 flex flex-col bg-black/25 dark:bg-white/10 border-r border-black/10 dark:border-white/10 transition-all duration-300 ${
        expanded ? 'w-56' : 'w-14'
      }`}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-end p-2 border-b border-black/10 dark:border-white/10">
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          {expanded ? (
            <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          )}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {moduleConfig.sidebar.map((item: any) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-2 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {expanded && (
                <span className="text-sm truncate">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}