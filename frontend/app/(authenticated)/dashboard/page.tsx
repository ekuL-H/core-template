'use client'

import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth'
import AppShell from '@/components/layout/AppShell'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>
      <p className="text-muted-foreground">Welcome to your dashboard.</p>
    </AppShell>
  )
}