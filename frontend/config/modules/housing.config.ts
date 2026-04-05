import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  CreditCard,
  FileText,
  Settings
} from 'lucide-react'

export const housingConfig = {
  module: 'housing',
  name: 'Housing Management',
  sidebar: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Properties', href: '/properties', icon: Building2 },
    { label: 'Tenants', href: '/tenants', icon: Users },
    { label: 'Maintenance', href: '/maintenance', icon: Wrench },
    { label: 'Payments', href: '/payments', icon: CreditCard },
    { label: 'Documents', href: '/documents', icon: FileText },
    { label: 'Settings', href: '/settings', icon: Settings },
  ]
}