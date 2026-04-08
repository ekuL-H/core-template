'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { isLoggedIn } from '@/lib/auth'

interface AuthContextType {
  authed: boolean
}

const AuthContext = createContext<AuthContextType>({ authed: false })

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = '/auth'
    } else {
      setAuthed(true)
      setChecking(false)
    }
  }, [])

  if (checking) return null

  return (
    <AuthContext.Provider value={{ authed }}>
      {children}
    </AuthContext.Provider>
  )
}