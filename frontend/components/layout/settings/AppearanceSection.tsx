'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type ThemeMode = 'light' | 'dark' | 'system'

export default function AppearanceSection() {
  const [theme, setTheme] = useState<ThemeMode>('system')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeMode
    setTheme(saved === 'light' || saved === 'dark' ? saved : 'system')
  }, [])

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode)
    if (mode === 'system') {
      localStorage.removeItem('theme')
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', isDark)
    } else {
      localStorage.setItem('theme', mode)
      document.documentElement.classList.toggle('dark', mode === 'dark')
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-4">Appearance</h2>
      <label className="text-sm text-foreground mb-2 block">Theme</label>
      <div className="flex gap-2">
        {[
          { mode: 'light' as ThemeMode, label: 'Light', icon: Sun },
          { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
          { mode: 'system' as ThemeMode, label: 'System', icon: Monitor },
        ].map(({ mode, label, icon: Icon }) => (
          <button key={mode} onClick={() => handleThemeChange(mode)}
            className={`flex items-center gap-2 px-4 py-2 text-xs rounded-md border transition-colors ${
              theme === mode ? 'border-primary bg-primary/5 text-foreground font-medium' : 'border-input text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}