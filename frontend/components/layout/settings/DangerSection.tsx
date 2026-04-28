'use client'

import { useState } from 'react'
import { coreApi } from '@/lib/api/core'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function DangerSection() {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div>
      <h2 className="text-sm font-semibold text-destructive mb-4">Danger Zone</h2>
      <div className="p-4 rounded-md border border-destructive/30 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Delete Account</p>
            <p className="text-[11px] text-muted-foreground">Permanently delete your account and all data. This cannot be undone.</p>
          </div>
          <button onClick={() => setShowConfirm(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
            Delete Account
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Delete Account"
          message="This will permanently delete your account, all workspaces, and all data. This action cannot be undone."
          confirmLabel="Delete Everything"
          confirmDestructive={true}
          onConfirm={async () => {
            try {
              await coreApi.deleteAccount()
              localStorage.clear()
              window.location.href = '/auth'
            } catch (err) {
              console.error('Failed to delete account', err)
              setShowConfirm(false)
            }
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}