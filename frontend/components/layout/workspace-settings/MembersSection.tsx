'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/lib/workspace'
import { Users } from 'lucide-react'

export default function MembersSection() {
  const { workspace } = useWorkspace()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Members</h2>
      </div>

      <div className="text-center py-12">
        <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-1">Member management coming soon</p>
        <p className="text-xs text-muted-foreground/60">Invite people, assign roles, and manage access</p>
      </div>
    </div>
  )
}