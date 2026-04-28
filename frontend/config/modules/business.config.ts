import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Receipt,
  Calendar,
  MessageSquare,
} from 'lucide-react'

export const businessConfig = {
  module: 'business',
  name: 'Business Manager',
  sidebar: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Clients', href: '/business/clients', icon: Users },
    { label: 'Jobs', href: '/business/jobs', icon: ClipboardList },
    { label: 'Invoicing', href: '/business/invoicing', icon: Receipt },
    { label: 'Schedule', href: '/business/schedule', icon: Calendar },
    { label: 'Messages', href: '/business/messages', icon: MessageSquare },
  ]
}