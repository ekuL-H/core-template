'use client'

import { useState } from 'react'
import { useWorkspace } from '@/lib/workspace'
import { coreApi } from '@/lib/api/core'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function DangerSection() {
  const { workspace } = useWorkspace()
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null)

  const handleArchive = async () => {
    if (!workspace) return
    try {
      await coreApi.archiveWorkspace(workspace.id)
      localStorage.removeItem('activeWorkspace')
      window.location.href = '/workspaces'
    } catch (err) {
      console.error('Failed to archive workspace', err)
      setConfirmAction(null)
    }
  }

  const handleDelete = async () => {
    if (!workspace) return
    try {
      await coreApi.deleteWorkspace(workspace.id)
      localStorage.removeItem('activeWorkspace')
      window.location.href = '/workspaces'
    } catch (err) {
      console.error('Failed to delete workspace', err)
      setConfirmAction(null)
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-destructive mb-4">Danger Zone</h2>

      <div className="space-y-3">
        <div className="p-4 rounded-md border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Archive Workspace</p>
              <p className="text-[11px] text-muted-foreground">Workspace will be archived and deleted after 30 days. You can restore it anytime before then.</p>
            </div>
            <button
              onClick={() => setConfirmAction('archive')}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-foreground hover:bg-accent transition-colors flex-shrink-0"
            >
              Archive
            </button>
          </div>
        </div>

        <div className="p-4 rounded-md border border-destructive/30 bg-destructive/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Delete Workspace</p>
              <p className="text-[11px] text-muted-foreground">Permanently delete this workspace and all its data. This cannot be undone.</p>
            </div>
            <button
              onClick={() => setConfirmAction('delete')}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors flex-shrink-0"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {confirmAction === 'archive' && (
        <ConfirmDialog
          title="Archive Workspace"
          message="This workspace will be archived and automatically deleted after 30 days. You can restore it anytime before then."
          confirmLabel="Archive"
          confirmDestructive={true}
          onConfirm={handleArchive}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'delete' && (
        <ConfirmDialog
          title="Delete Workspace"
          message={`This will permanently delete "${workspace?.name}" and all its data. This action cannot be undone.`}
          confirmLabel="Delete Permanently"
          confirmDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}