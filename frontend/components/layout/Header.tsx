'use client'

import { ArrowLeft, ArrowRight, Plus, Search, Bell, Calendar, HelpCircle, ChevronDown } from 'lucide-react'

interface HeaderProps {
  sidebarExpanded: boolean
}

export default function Header({ sidebarExpanded }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-11 flex items-stretch bg-sidebar border-b border-sidebar-border">
      {/* Logo + Workspace - always full sidebar width */}
      <div className="flex items-center gap-2 px-3 border-r border-sidebar-border flex-shrink-0 w-56">
        {/* Logo */}
        <div className="w-6 h-6 rounded-md bg-foreground flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-bold text-background tracking-tight">T-AI</span>
        </div>

        {/* Workspace switcher */}
        <button className="flex items-center justify-between px-2 py-1 rounded-md text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-1 min-w-0 border border-border">
          <span className="truncate">Trading</span>
          <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-60 ml-1" />
        </button>
      </div>

      {/* Browser-style navigation area */}
      <div className="flex items-center flex-1 px-3 gap-1 min-w-0">
        <div className="flex items-center gap-0.5">
          <button
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled
            title="Back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled
            title="Forward"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-t bg-background border border-border border-b-background -mb-px text-[12px] max-w-[180px]">
            <span className="truncate text-foreground">Dashboard</span>
          </div>
          <button
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="New tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-0.5 px-2 border-l border-sidebar-border">
        <button
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Search"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Calendar"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Help"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  )
}