'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { tradingConfig } from '@/config/modules/trading.config'
import { housingConfig } from '@/config/modules/housing.config'

const MODULE_CONFIGS: Record<string, any> = {
  trading: tradingConfig,
  housing: housingConfig,
}

interface ActiveWorkspace {
  id: string
  type: string
  name?: string
}

interface WorkspaceContextType {
  workspace: ActiveWorkspace | null
  moduleConfig: any
  setWorkspace: (ws: ActiveWorkspace) => void
  clearWorkspace: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    return {
      workspace: null,
      moduleConfig: null,
      setWorkspace: () => {},
      clearWorkspace: () => {},
    } as any
  }
  return ctx
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [workspace, setWorkspaceState] = useState<ActiveWorkspace | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('activeWorkspace')
    if (saved) {
      try {
        setWorkspaceState(JSON.parse(saved))
      } catch {}
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded && !workspace) {
      router.push('/workspaces')
    }
  }, [loaded, workspace])

  const setWorkspace = (ws: ActiveWorkspace) => {
    localStorage.setItem('activeWorkspace', JSON.stringify(ws))
    setWorkspaceState(ws)
  }

  const clearWorkspace = () => {
    localStorage.removeItem('activeWorkspace')
    setWorkspaceState(null)
    router.push('/workspaces')
  }

  const moduleConfig = workspace ? (MODULE_CONFIGS[workspace.type] || tradingConfig) : tradingConfig

  if (!loaded) return null
  if (!workspace) return null

  return (
    <WorkspaceContext.Provider value={{ workspace, moduleConfig, setWorkspace, clearWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}