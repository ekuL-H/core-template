'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { moduleConfig } from '@/config'

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
  // Check sidebar config first
  const sidebarItem = moduleConfig.sidebar.find((item: any) => item.href === route)
  if (sidebarItem) return sidebarItem.label

  // Check if it's a sub-route of a sidebar item
  const parentItem = moduleConfig.sidebar.find((item: any) =>
    route.startsWith(item.href + '/')
  )
  if (parentItem) {
    const segments = route.split('/')
    const lastSegment = segments[segments.length - 1]
    // If it's a UUID-like string, just use parent label + "Detail"
    if (lastSegment.length > 8 && lastSegment.includes('-')) {
      return parentItem.label
    }
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
  }

  // Fallback
  const segments = route.split('/').filter(Boolean)
  if (segments.length === 0) return 'Dashboard'
  const last = segments[segments.length - 1]
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
}

const STORAGE_KEY = 'browser_tabs'

function loadTabs(): { tabs: Tab[]; activeTabId: string } {
  if (typeof window === 'undefined') {
    return {
      tabs: [{ id: 'tab_default', title: 'Dashboard', route: '/dashboard', history: ['/dashboard'], historyIndex: 0 }],
      activeTabId: 'tab_default'
    }
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.tabs?.length > 0) return parsed
    }
  } catch {}

  return {
    tabs: [{ id: 'tab_default', title: 'Dashboard', route: '/dashboard', history: ['/dashboard'], historyIndex: 0 }],
    activeTabId: 'tab_default'
  }
}

function saveTabs(tabs: Tab[], activeTabId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeTabId }))
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

  // Sync route changes to active tab (when user navigates via sidebar/links)
  useEffect(() => {
    if (isNavigatingFromTab) {
      setIsNavigatingFromTab(false)
      return
    }

    setTabs(prev => prev.map(tab => {
      if (tab.id !== activeTabId) return tab
      if (tab.route === pathname) return tab

      // Push to history
      const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), pathname]
      return {
        ...tab,
        route: pathname,
        title: getTitleForRoute(pathname),
        history: newHistory,
        historyIndex: newHistory.length - 1
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

  const addTab = useCallback((route: string = '/dashboard') => {
    const title = getTitleForRoute(route)
    const newTab: Tab = {
      id: generateId(),
      title,
      route,
      history: [route],
      historyIndex: 0
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setIsNavigatingFromTab(true)
    setTimeout(() => router.push(route), 0)
  }, [router])

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      if (prev.length <= 1) return prev // minimum 1 tab

      const index = prev.findIndex(t => t.id === id)
      const newTabs = prev.filter(t => t.id !== id)

      // If closing active tab, switch to adjacent
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
      const newHistory = [...tab.history.slice(0, tab.historyIndex + 1), route]
      return {
        ...tab,
        route,
        title: getTitleForRoute(route),
        history: newHistory,
        historyIndex: newHistory.length - 1
      }
    }))
    setIsNavigatingFromTab(true)
    router.push(route)
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
      return {
        ...tab,
        route,
        title: getTitleForRoute(route),
        historyIndex: newIndex
      }
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
      return {
        ...tab,
        route,
        title: getTitleForRoute(route),
        historyIndex: newIndex
      }
    }))
  }, [canGoForward, activeTabId, router])

  return (
    <TabsContext.Provider value={{
      tabs,
      activeTabId,
      setActiveTab,
      addTab,
      closeTab,
      navigateInTab,
      goBack,
      goForward,
      canGoBack,
      canGoForward
    }}>
      {children}
    </TabsContext.Provider>
  )
}