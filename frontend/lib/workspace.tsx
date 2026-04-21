'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface ActiveWorkspace {
  id: string
  type: string
  name?: string
}

interface WorkspaceContextType {
  workspace: ActiveWorkspace | null
  setWorkspace: (ws: ActiveWorkspace) => void
  clearWorkspace: () => void
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
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

  if (!loaded) return null
  if (!workspace) return null

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, clearWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}