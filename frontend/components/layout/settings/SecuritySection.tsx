'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { coreApi } from '@/lib/api/core'

export default function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return }
    setChangingPassword(true)
    try {
      await coreApi.changePassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 2000)
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || 'Failed to change password')
    } finally { setChangingPassword(false) }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-4">Security</h2>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        {passwordError && (
          <div className="px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 max-w-sm">
            <p className="text-xs text-destructive">{passwordError}</p>
          </div>
        )}
        {passwordSuccess && (
          <div className="px-3 py-2 rounded-md bg-success/10 border border-success/20 max-w-sm">
            <p className="text-xs text-success">Password changed successfully</p>
          </div>
        )}
        <button onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md border border-input text-foreground hover:bg-accent disabled:opacity-50 transition-colors">
          {changingPassword ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {changingPassword ? 'Changing...' : 'Change Password'}
        </button>
      </div>

      <div className="pt-6 mt-6 border-t border-border">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Sessions</h3>
        <div className="flex items-center justify-between p-3 rounded-md border border-border">
          <div>
            <p className="text-sm text-foreground">Logout All Devices</p>
            <p className="text-[11px] text-muted-foreground">Sign out from all other browsers and devices</p>
          </div>
          <button
            onClick={async () => {
              try {
                await coreApi.logoutAllDevices()
                localStorage.clear()
                window.location.href = '/auth'
              } catch (err) { console.error('Failed to logout all devices', err) }
            }}
            className="px-3 py-1.5 text-xs rounded-md border border-input text-foreground hover:bg-accent transition-colors"
          >
            Logout All
          </button>
        </div>
      </div>
    </div>
  )
}