'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { moduleConfig } from '@/config'

interface BreadcrumbOverride {
  label: string
  href?: string
}

interface BreadcrumbProps {
  overrides?: BreadcrumbOverride[]
}

export default function Breadcrumb({ overrides }: BreadcrumbProps) {
  const pathname = usePathname()

  const buildCrumbs = (): { label: string; href?: string }[] => {
    // First crumb is always the workspace name
    const crumbs: { label: string; href?: string }[] = [
      { label: moduleConfig.name, href: '/dashboard' }
    ]

    // If overrides are provided, use them (for detail pages like /watchlist/[id])
    if (overrides) {
      return [...crumbs, ...overrides]
    }

    // Otherwise, derive from pathname
    const segments = pathname.split('/').filter(Boolean)
    
    segments.forEach((segment, i) => {
      const href = '/' + segments.slice(0, i + 1).join('/')
      // Match against sidebar config for a clean label
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
    <div className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
            )}
            {isLast || !crumb.href ? (
              <span className="text-zinc-900 dark:text-white font-medium">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
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