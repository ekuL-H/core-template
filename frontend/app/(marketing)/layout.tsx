'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)

    const token = localStorage.getItem('token')
    setAuthed(!!token)
  }, [])

  const navLinks = [
    { label: 'Trading', href: '/trading' },
    { label: 'Property', href: '/property' },
    { label: 'Business', href: '/business' },
  ]

  if (authed === null) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-[8px] font-bold text-background tracking-tight">Oasis</span>
            </div>
            <span className="text-sm font-semibold text-foreground">Oasis</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  pathname === link.href
                    ? 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {authed ? (
            <button
              onClick={() => router.push('/workspaces')}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Go to Workspaces
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/auth')}
                className="px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-8 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center">
                  <span className="text-[6px] font-bold text-background">Oasis</span>
                </div>
                <span className="text-xs font-medium text-foreground">Oasis</span>
              </div>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                One platform for trading, property management, and business operations.
              </p>
            </div>

            <div className="flex gap-12">
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-medium text-foreground">Products</span>
                <button onClick={() => router.push('/trading')} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left">Trading</button>
                <button onClick={() => router.push('/property')} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left">Property</button>
                <button onClick={() => router.push('/business')} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left">Business</button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-medium text-foreground">Legal</span>
                <span className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Privacy</span>
                <span className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Terms</span>
                <span className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Contact</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <span className="text-[11px] text-muted-foreground">© 2026 Oasis. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}