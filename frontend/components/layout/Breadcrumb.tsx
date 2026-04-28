'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useWorkspace } from '@/lib/workspace'

interface BreadcrumbOverride {
  label: string
  href?: string
}

interface BreadcrumbProps {
  overrides?: BreadcrumbOverride[]
}

export default function Breadcrumb({ overrides }: BreadcrumbProps) {
  const pathname = usePathname()
  const { moduleConfig } = useWorkspace()

  const buildCrumbs = (): { label: string; href?: string }[] => {
    const crumbs: { label: string; href?: string }[] = [
      { label: moduleConfig.name, href: '/dashboard' }
    ]

    if (overrides) {
      return [...crumbs, ...overrides]
    }

    const segments = pathname.split('/').filter(Boolean)

    // Skip 'trading' or 'property' segment in breadcrumb display
    const displaySegments = segments.filter(s => s !== moduleConfig.module)

    displaySegments.forEach((segment, i) => {
      const href = '/' + segments.slice(0, segments.indexOf(segment) + 1).join('/')
      const sidebarItem = moduleConfig.sidebar.find(
        (item: any) => item.href === href
      )
      const label = sidebarItem
        ? sidebarItem.label
        : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

      crumbs.push({ label, href })
    })

    return crumbs
  }

  const crumbs = buildCrumbs()

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            {isLast || !crumb.href ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )
}