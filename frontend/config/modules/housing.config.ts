import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  CreditCard,
  FileText,
} from 'lucide-react'

export const housingConfig = {
  module: 'housing',
  name: 'Housing Management',
  sidebar: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Properties', href: '/housing/properties', icon: Building2 },
    { label: 'Tenants', href: '/housing/tenants', icon: Users },
    { label: 'Maintenance', href: '/housing/maintenance', icon: Wrench },
    { label: 'Payments', href: '/housing/payments', icon: CreditCard },
    { label: 'Documents', href: '/housing/documents', icon: FileText },
  ]
}