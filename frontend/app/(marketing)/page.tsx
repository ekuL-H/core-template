'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LineChart, Home, Briefcase, ArrowRight, ChevronRight,
  Zap, Shield, Blocks, Bot, ArrowUpRight
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setAuthed(!!token)
  }, [])

  const handleGetStarted = () => {
    router.push(authed ? '/workspaces' : '/auth')
  }

  const products = [
    {
      icon: LineChart,
      color: '#6366f1',
      title: 'Oasis Trading',
      tag: 'Live',
      description: 'Charts, watchlists, trade journal, and AI analysis — with live MT5 integration and real-time market data.',
      features: ['Live MT5 Data', 'Trade Journal', 'AI Analysis', 'Custom Dashboards'],
      href: '/trading',
    },
    {
      icon: Home,
      color: '#22c55e',
      title: 'Oasis Property',
      tag: 'Coming Soon',
      description: 'Manage properties, tenants, maintenance, payments, and documents — everything a landlord needs in one place.',
      features: ['Property Management', 'Tenant Portal', 'Maintenance Tracking', 'Payment History'],
      href: '/property',
    },
    {
      icon: Briefcase,
      color: '#f59e0b',
      title: 'Oasis Business',
      tag: 'Planned',
      description: 'Run any service-based business. Manage clients, jobs, invoicing, and team — built for contractors, freelancers, and agencies.',
      features: ['Client Management', 'Job Tracking', 'Invoicing', 'Team Scheduling'],
      href: '/business',
    },
  ]

  const highlights = [
    {
      icon: Blocks,
      title: 'One Account, Many Workspaces',
      description: 'Each workspace is its own product experience — isolated data, dedicated tools, separate teams. Switch between them instantly.',
    },
    {
      icon: Bot,
      title: 'AI That Stays Private',
      description: 'Local AI models run on your machine. Your data never leaves your infrastructure. Zero API costs.',
    },
    {
      icon: Shield,
      title: 'Your Data, Your Control',
      description: 'Self-hosted, workspace-isolated, fully audited. Every action is logged, every workspace is independent.',
    },
    {
      icon: Zap,
      title: 'Real-time Everything',
      description: 'Live market data, instant updates, browser-style tabs for multitasking across any workspace.',
    },
  ]

  if (authed === null) return null

  return (
    <>
      {/* Hero */}
      <div className="px-6 md:px-12 pt-24 pb-20 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border text-[11px] text-muted-foreground mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Oasis Trading is live
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
          Your workspace for
          <br />
          <span className="text-muted-foreground">everything</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto mb-8">
          One platform for trading, property management, and business operations.
          Each product lives in its own workspace — one account, all your tools.
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
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
          >
            Explore Products
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products */}
      <div id="products" className="px-6 md:px-12 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">Three products, one platform</h2>
          <p className="text-sm text-muted-foreground">Each workspace is a complete product — its own tools, data, and team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <button
              key={product.href}
              onClick={() => router.push(product.href)}
              className="rounded-xl border border-border bg-card overflow-hidden hover:border-foreground/20 transition-all text-left group"
            >
              <div className="h-1" style={{ backgroundColor: product.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: product.color + '15' }}>
                    <product.icon className="w-5 h-5" style={{ color: product.color }} />
                  </div>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: product.color + '15',
                      color: product.color,
                    }}
                  >
                    {product.tag}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-card-foreground mb-1.5">{product.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{product.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {product.features.map((feature) => (
                    <span key={feature} className="px-2 py-0.5 text-[10px] rounded-md bg-accent text-foreground">
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Learn more
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-2">Built different</h2>
            <p className="text-sm text-muted-foreground">The platform foundations that every product shares.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {highlights.map((item) => (
              <div key={item.title} className="flex flex-col gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-foreground" />
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
          <p className="text-sm text-muted-foreground mb-6">Create your first workspace in seconds. Free to use.</p>
          <button
            onClick={handleGetStarted}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors mx-auto"
          >
            {authed ? 'Go to Workspaces' : 'Create Free Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}