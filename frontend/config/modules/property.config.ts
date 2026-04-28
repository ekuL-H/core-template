import {
  LayoutDashboard,
  Building2,
  Users,
  Wrench,
  CreditCard,
  FileText,
} from 'lucide-react'

export const propertyConfig = {
  module: 'property',
  name: 'Property Management',
  sidebar: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Properties', href: '/property/properties', icon: Building2 },
    { label: 'Tenants', href: '/property/tenants', icon: Users },
    { label: 'Maintenance', href: '/property/maintenance', icon: Wrench },
    { label: 'Payments', href: '/property/payments', icon: CreditCard },
    { label: 'Documents', href: '/property/documents', icon: FileText },
  ]
}