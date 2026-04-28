'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check } from 'lucide-react'
import { coreApi } from '@/lib/api/core'

export default function AccountSection() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => { fetchUser() }, [])

  const fetchUser = async () => {
    try {
      const data = await coreApi.getMe()
      setUser(data)
      setEditName(data.name || '')
      setEditEmail(data.email)
    } catch (err) { console.error('Failed to fetch user', err) }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const updated = await coreApi.updateMe({ name: editName, email: editEmail })
      setUser(updated)
      localStorage.setItem('userEmail', updated.email)
      if (updated.name) localStorage.setItem('userName', updated.name)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) { console.error('Failed to save profile', err) }
    finally { setSaving(false) }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) return <p className="text-xs text-muted-foreground">Loading...</p>

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-4">Account</h2>
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-semibold text-primary">
            {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{user?.name || 'No name set'}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <p className="text-[10px] text-muted-foreground/50 mt-0.5">
            Member since {user?.createdAt ? formatDate(user.createdAt) : '—'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name</label>
          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name"
            className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Email</label>
          <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
            className="w-full max-w-sm px-3 py-2 text-sm rounded-md border border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saveSuccess ? <Check className="w-3 h-3" /> : null}
          {saving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-6">Account ID: {user?.id}</p>
    </div>
  )
}