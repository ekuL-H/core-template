'use client'

import { moduleConfig } from '@/config'

interface HeaderProps {
  sidebarExpanded: boolean
}

export default function Header({ sidebarExpanded }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[35px] flex items-center px-4 bg-white dark:bg-zinc-900 border-b border-black/10 dark:border-white/10">
      <div
        className="flex items-center gap-2 transition-all duration-300"
        style={{ width: sidebarExpanded ? '14rem' : '3rem' }}
      >
        <div className="w-5 h-5 rounded bg-blue-600 flex-shrink-0" />
        {sidebarExpanded && (
          <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
            {moduleConfig.name}
          </span>
        )}
      </div>
    </header>
  )
}