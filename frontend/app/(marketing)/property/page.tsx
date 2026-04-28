'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Home, Building, Users, Wrench, CreditCard,
  FileText, Bell, MessageSquare, Shield
} from 'lucide-react'

export default function PropertyPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setAuthed(!!token)
  }, [])

  const handleGetStarted = () => {
    router.push(authed ? '/workspaces' : '/auth')
  }

  const features = [
    {
      icon: Building,
      title: 'Property Portfolio',
      description: 'Track all your properties in one place. Unit details, purchase info, mortgage tracking, and property documents.',
    },
    {
      icon: Users,
      title: 'Tenant Management',
      description: 'Tenant profiles, lease tracking, rent history, and communication logs. Tenants get their own portal to view and pay.',
    },
    {
      icon: Wrench,
      title: 'Maintenance Tracking',
      description: 'Tenants submit requests, you assign contractors, track progress. Full audit trail from report to resolution.',
    },
    {
      icon: CreditCard,
      title: 'Payments & Rent',
      description: 'Rent collection, payment history, arrears tracking, and receipt generation. Clear financial overview per property.',
    },
    {
      icon: FileText,
      title: 'Documents',
      description: 'Lease agreements, inspection reports, certificates, and correspondence. Everything stored against the right property and tenant.',
    },
    {
      icon: MessageSquare,
      title: 'Communications',
      description: 'Message tenants, log phone calls, track email correspondence. Full history tied to the property and tenant.',
    },
    {
      icon: Bell,
      title: 'Reminders & Alerts',
      description: 'Lease expiry, gas safety renewal, rent due dates, inspection schedules. Never miss a deadline.',
    },
    {
      icon: Shield,
      title: 'Compliance',
      description: 'Track certificates, safety checks, and legal requirements per property. Stay compliant without the spreadsheet chaos.',
    },
  ]

  if (authed === null) return null

  return (
    <>
      {/* Hero */}
      <div className="px-6 md:px-12 pt-24 pb-16 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#6C7D3615' }}>
            <Home className="w-4 h-4" style={{ color: '#6C7D36' }} />
          </div>
          <span className="text-xs font-medium" style={{ color: '#6C7D36' }}>Oasis Property</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-warning/15 text-warning">Coming Soon</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
          Property management,
          <br />
          <span className="text-muted-foreground">without the chaos</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mb-8">
          Everything a landlord needs — properties, tenants, maintenance, payments, and documents — in one workspace. Tenants get their own view.
        </p>
        <button
          onClick={handleGetStarted}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
        >
          {authed ? 'Go to Workspaces' : 'Get Notified'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Features */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-2">What we're building</h2>
          <p className="text-sm text-muted-foreground mb-10">Designed for landlords managing 1 to 100+ properties.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-5 flex gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-card-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roles teaser */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-2">Built for teams</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Oasis Property supports multiple roles within a workspace. Each person sees only what they need.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: 'Landlord', desc: 'Full access. Manage properties, tenants, finances, and maintenance.' },
              { role: 'Manager', desc: 'Day-to-day operations. Handle maintenance, tenant comms, and inspections.' },
              { role: 'Tenant', desc: 'View lease, submit maintenance requests, see payment history, and communicate.' },
            ].map((item) => (
              <div key={item.role} className="rounded-xl border border-border bg-card p-4">
                <div className="text-sm font-medium text-foreground mb-1">{item.role}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 md:px-12 py-16 border-t border-border">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Interested?</h2>
          <p className="text-sm text-muted-foreground mb-6">Create an account and you'll be first to know when Property launches.</p>
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