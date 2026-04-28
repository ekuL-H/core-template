'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { tradingConfig } from '@/config/modules/trading.config'
import { propertyConfig } from '@/config/modules/property.config'
import { businessConfig } from '@/config/modules/business.config'

const MODULE_CONFIGS: Record<string, any> = {
  trading: tradingConfig,
  property: propertyConfig,
  business: businessConfig,
}

function getModuleConfig(): any {
  if (typeof window === 'undefined') return tradingConfig
  try {
    const ws = localStorage.getItem('activeWorkspace')
    if (ws) {
      const parsed = JSON.parse(ws)
      if (parsed.type && MODULE_CONFIGS[parsed.type]) return MODULE_CONFIGS[parsed.type]
    }
  } catch {}
  return tradingConfig
}

interface Tab {
  id: string
  title: string
  route: string
  history: string[]
  historyIndex: number
}

interface TabsContextType {
  tabs: Tab[]
  activeTabId: string
  setActiveTab: (id: string) => void
  addTab: (route?: string) => void
  closeTab: (id: string) => void
  navigateInTab: (route: string) => void
  goBack: () => void
  goForward: () => void
  canGoBack: boolean
  canGoForward: boolean
  resetTabs: () => void
  reorderTabs: (fromIndex: number, toIndex: number) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

export function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('useTabs must be used within TabsProvider')
  return ctx
}

function generateId() {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function getTitleForRoute(route: string): string {
  const config = getModuleConfig()
  
  const sidebarItem = config.sidebar.find((item: any) => item.href === route)
  if (sidebarItem) return sidebarItem.label

  const parentItem = config.sidebar.find((item: any) =>
    route.startsWith(item.href + '/')
  )
  if (parentItem) {
    const segments = route.split('/')
    const lastSegment = segments[segments.length - 1]
    if (lastSegment.length > 8 && lastSegment.includes('-')) return parentItem.label
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
  }

  const segments = route.split('/').filter(Boolean)
  if (segments.length === 0) return 'Dashboard'
  const last = segments[segments.length - 1]
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
}

const MAX_HISTORY = 50

function getStorageKey(): string {
  if (typeof window === 'undefined') return 'browser_tabs'
  try {
    const ws = localStorage.getItem('activeWorkspace')
    if (ws) {
      const parsed = JSON.parse(ws)
      if (parsed.id) return `browser_tabs_${parsed.id}`
    }
  } catch {}
  return 'browser_tabs'
}

const DEFAULT_TABS = {
  tabs: [{ id: 'tab_default', title: 'Dashboard', route: '/dashboard', history: ['/dashboard'], historyIndex: 0 }],
  activeTabId: 'tab_default'
}

function loadTabs(): { tabs: Tab[]; activeTabId: string } {
  if (typeof window === 'undefined') return DEFAULT_TABS

  try {
    const saved = localStorage.getItem(getStorageKey())
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.tabs?.length > 0) return parsed
    }
  } catch {}

  return DEFAULT_TABS
}

function saveTabs(tabs: Tab[], activeTabId: string) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify({ tabs, activeTabId }))
  } catch {}
}

export function TabsProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [tabs, setTabs] = useState<Tab[]>(() => loadTabs().tabs)
  const [activeTabId, setActiveTabId] = useState<string>(() => loadTabs().activeTabId)
  const [isNavigatingFromTab, setIsNavigatingFromTab] = useState(false)

  // Persist tabs on change
  useEffect(() => {
    saveTabs(tabs, activeTabId)
  }, [tabs, activeTabId])

  // Sync route changes to active tab
  useEffect(() => {
    if (isNavigatingFromTab) {
      setIsNavigatingFromTab(false)
      return
    }

    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab
      if (tab.route === pathname) return tab

      let newHistory = [...tab.history.slice(0, tab.historyIndex + 1), pathname]
      let newIndex = newHistory.length - 1

      // Trim history if too long
      if (newHistory.length > MAX_HISTORY) {
        const excess = newHistory.length - MAX_HISTORY
        newHistory = newHistory.slice(excess)
        newIndex = newHistory.length - 1
      }

      return {
        ...tab,
        route: pathname,
        title: getTitleForRoute(pathname),
        history: newHistory,
        historyIndex: newIndex
      }
    }))
  }, [pathname, activeTabId])

  const setActiveTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id)
    if (!tab) return
    setActiveTabId(id)
    setIsNavigatingFromTab(true)
    setTimeout(() => router.push(tab.route), 0)
  }, [tabs, router])

  const MAX_TABS = 12

  const addTab = useCallback((route: string = '/dashboard') => {
    setTabs(prev => {
      if (prev.length >= MAX_TABS) return prev

      const title = getTitleForRoute(route)
      const newTab: Tab = {
        id: generateId(),
        title,
        route,
        history: [route],
        historyIndex: 0
      }
      setActiveTabId(newTab.id)
      setIsNavigatingFromTab(true)
      setTimeout(() => router.push(route), 0)
      return [...prev, newTab]
    })
  }, [router])

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      if (prev.length <= 1) return prev

      const index = prev.findIndex(t => t.id === id)
      const newTabs = prev.filter(t => t.id !== id)

      if (id === activeTabId) {
        const newIndex = Math.min(index, newTabs.length - 1)
        const newActive = newTabs[newIndex]
        setActiveTabId(newActive.id)
        setIsNavigatingFromTab(true)
        setTimeout(() => router.push(newActive.route), 0)
      }

      return newTabs
    })
  }, [activeTabId, router])

  const navigateInTab = useCallback((route: string) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab

      let newHistory = [...tab.history.slice(0, tab.historyIndex + 1), route]
      let newIndex = newHistory.length - 1

      if (newHistory.length > MAX_HISTORY) {
        const excess = newHistory.length - MAX_HISTORY
        newHistory = newHistory.slice(excess)
        newIndex = newHistory.length - 1
      }

      return {
        ...tab,
        route,
        title: getTitleForRoute(route),
        history: newHistory,
        historyIndex: newIndex
      }
    }))
    setIsNavigatingFromTab(true)
    setTimeout(() => router.push(route), 0)
  }, [activeTabId, router])

  const activeTab = tabs.find(t => t.id === activeTabId)
  const canGoBack = (activeTab?.historyIndex ?? 0) > 0
  const canGoForward = (activeTab?.historyIndex ?? 0) < ((activeTab?.history.length ?? 1) - 1)

  const goBack = useCallback(() => {
    if (!canGoBack) return
    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab
      const newIndex = tab.historyIndex - 1
      const route = tab.history[newIndex]
      setIsNavigatingFromTab(true)
      setTimeout(() => router.push(route), 0)
      return { ...tab, route, title: getTitleForRoute(route), historyIndex: newIndex }
    }))
  }, [canGoBack, activeTabId, router])

  const goForward = useCallback(() => {
    if (!canGoForward) return
    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab
      const newIndex = tab.historyIndex + 1
      const route = tab.history[newIndex]
      setIsNavigatingFromTab(true)
      setTimeout(() => router.push(route), 0)
      return { ...tab, route, title: getTitleForRoute(route), historyIndex: newIndex }
    }))
  }, [canGoForward, activeTabId, router])

  const resetTabs = useCallback(() => {
    setTabs(DEFAULT_TABS.tabs)
    setActiveTabId(DEFAULT_TABS.activeTabId)
    setIsNavigatingFromTab(true)
    setTimeout(() => router.push('/dashboard'), 0)
  }, [router])

  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    setTabs(prev => {
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated
    })
  }, [])

  return (
    <TabsContext.Provider value={{
      tabs, activeTabId, setActiveTab, addTab, closeTab,
      navigateInTab, goBack, goForward, canGoBack, canGoForward, resetTabs, reorderTabs
    }}>
      {children}
    </TabsContext.Provider>
  )
}