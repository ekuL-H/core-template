'use client'

import { useState } from 'react'
import { useWorkspace } from '@/lib/workspace'
import { coreApi } from '@/lib/api/core'
import { Loader2 } from 'lucide-react'

export default function GeneralSection() {
  const { workspace, setWorkspace } = useWorkspace()
  const [name, setName] = useState(workspace?.name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!workspace || !name.trim() || name === workspace.name) return
    setSaving(true)
    try {
      await coreApi.updateWorkspace(workspace.id, { name: name.trim() })
      setWorkspace({ ...workspace, name: name.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to update workspace', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-4">General</h2>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Workspace Name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || name === workspace?.name}
              className="px-3 py-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Type</label>
          <p className="text-sm text-muted-foreground capitalize">{workspace?.type}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Visibility</label>
          <p className="text-sm text-muted-foreground">Private — only invited members can access this workspace</p>
        </div>
      </div>
    </div>
  )
}