'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Home, LineChart, BookOpen, Bot, ArrowRight, ChevronRight, Zap, Shield, Blocks } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)

    const token = localStorage.getItem('token')
    setAuthed(!!token)
  }, [])

  const handleGetStarted = () => {
    if (authed) {
      router.push('/workspaces')
    } else {
      router.push('/auth')
    }
  }

  const modules = [
    {
      icon: LayoutDashboard,
      color: '#6366f1',
      title: 'Oasis Trading',
      description: 'Live charts with MT5 integration, watchlists, trade journal, AI-powered analysis, and real-time market data.',
      features: ['Live MT5 Data', 'Trade Journal', 'AI Analysis', 'Custom Dashboards']
    },
    {
      icon: Home,
      color: '#22c55e',
      title: 'Oasis Housing',
      description: 'Property management, tenant tracking, maintenance requests, payments, and document management.',
      features: ['Property Management', 'Tenant Portal', 'Maintenance', 'Payments']
    },
  ]

  const highlights = [
    { icon: Blocks, title: 'Modular Workspaces', description: 'Each workspace is independent with its own data, tools, and team members.' },
    { icon: Bot, title: 'Built-in AI', description: 'Local AI models for analysis. Your data stays on your machine, zero API costs.' },
    { icon: Shield, title: 'Your Data, Your Control', description: 'Self-hosted, workspace-isolated data. Nothing leaves your infrastructure.' },
    { icon: Zap, title: 'Real-time Everything', description: 'Live market data, instant updates, browser-style tabs for multitasking.' },
  ]

  if (authed === null) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-14 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-[8px] font-bold text-background tracking-tight">Oasis</span>
          </div>
          <span className="text-sm font-semibold text-foreground">Oasis</span>
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

      {/* Hero */}
      <div className="px-6 md:px-12 pt-20 pb-16 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border text-[11px] text-muted-foreground mb-6">
          <Zap className="w-3 h-3" />
          Now with AI-powered analysis
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
          Your workspace for
          <br />
          <span className="text-muted-foreground">everything</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto mb-8">
          Oasis brings your tools together. Trading, property management, and more — each in its own workspace, powered by local AI.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            {authed ? 'Open Workspaces' : 'Get Started Free'}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
          >
            Learn More
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modules */}
      <div id="modules" className="px-6 md:px-12 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">Built for what you do</h2>
          <p className="text-sm text-muted-foreground">Each module is a complete workspace with its own tools, data, and AI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-sm transition-all"
            >
              <div className="h-1.5" style={{ backgroundColor: mod.color }} />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: mod.color + '15' }}>
                    <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-card-foreground">{mod.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{mod.description}</p>
                <div className="flex flex-wrap gap-2">
                  {mod.features.map((feature, j) => (
                    <span key={j} className="px-2.5 py-1 text-[11px] rounded-md bg-accent text-foreground">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                  <item.icon className="w-4.5 h-4.5 text-foreground" />
                </div>
                <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Ready to start?</h2>
          <p className="text-sm text-muted-foreground mb-6">Create your first workspace in seconds.</p>
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors mx-auto"
          >
            {authed ? 'Go to Workspaces' : 'Create Free Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center">
              <span className="text-[6px] font-bold text-background">Oasis</span>
            </div>
            <span className="text-[11px] text-muted-foreground">© 2026 Oasis</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Privacy</span>
            <span className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Terms</span>
            <span className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  )
}