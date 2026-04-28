'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Briefcase, Users, ClipboardList, Receipt,
  Calendar, MessageSquare
} from 'lucide-react'

export default function BusinessPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setAuthed(!!token)
  }, [])

  const handleGetStarted = () => {
    router.push(authed ? '/workspaces' : '/auth')
  }

  const useCases = [
    { title: 'Contractors', desc: 'Plumbers, electricians, builders — manage jobs, clients, and invoices.' },
    { title: 'Freelancers', desc: 'Designers, developers, consultants — track projects, time, and payments.' },
    { title: 'Agencies', desc: 'Marketing, recruitment, cleaning — coordinate teams and manage client work.' },
  ]

  const planned = [
    { icon: Users, title: 'Client Management', desc: 'Contact details, job history, notes, and communications per client.' },
    { icon: ClipboardList, title: 'Job Tracking', desc: 'Create jobs, assign team members, track stages from quote to completion.' },
    { icon: Receipt, title: 'Invoicing', desc: 'Generate invoices from completed jobs, track payments, chase arrears.' },
    { icon: Calendar, title: 'Scheduling', desc: 'Calendar view, team availability, job scheduling, and reminders.' },
    { icon: MessageSquare, title: 'Client Portal', desc: 'Clients see their jobs, approve quotes, and communicate — no app download needed.' },
  ]

  if (authed === null) return null

  return (
    <>
      {/* Hero */}
      <div className="px-6 md:px-12 pt-24 pb-16 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f59e0b15' }}>
            <Briefcase className="w-4 h-4" style={{ color: '#f59e0b' }} />
          </div>
          <span className="text-xs font-medium" style={{ color: '#f59e0b' }}>Oasis Business</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent text-muted-foreground">Planned</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
          Run your business,
          <br />
          <span className="text-muted-foreground">not your admin</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mb-8">
          A workspace for any service-based business. Clients, jobs, invoicing, scheduling, and team management — all in one place.
        </p>
        <button
          onClick={handleGetStarted}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          {authed ? 'Go to Workspaces' : 'Get Notified'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Use cases */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-2">Built for</h2>
          <p className="text-sm text-muted-foreground mb-8">One workspace type, flexible enough for any service business.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {useCases.map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-5">
                <div className="text-sm font-medium text-foreground mb-1.5">{item.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Planned features */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-2">What we're planning</h2>
          <p className="text-sm text-muted-foreground mb-8">Early thinking — this will evolve based on what users need.</p>
          <div className="flex flex-col gap-3">
            {planned.map((item) => (
              <div key={item.title} className="rounded-xl border border-border bg-card p-4 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-card-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Want this?</h2>
          <p className="text-sm text-muted-foreground mb-6">Create an account to shape what Oasis Business becomes.</p>
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