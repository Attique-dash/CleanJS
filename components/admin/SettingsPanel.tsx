// components/admin/SettingsPanel.tsx
'use client'

import { useEffect, useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Notification from '../ui/Notification'

export default function SettingsPanel() {
  const [apiToken, setApiToken] = useState('')
  const [branch, setBranch] = useState('Main')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' })
        const data = await res.json()
        if (data.success) {
          setApiToken(data.settings.tasokoApiToken || '')
          setBranch(data.settings.defaultBranch || 'Main')
        }
      } catch (e) {
        // noop
      }
    }
    load()
  }, [])

  const save = async () => {
    try {
      setSaving(true)
      setMessage(null)
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasokoApiToken: apiToken, defaultBranch: branch })
      })
      const data = await res.json()
      if (data.success) setMessage('Settings saved')
      else setMessage('Failed to save')
    } catch (e) {
      setMessage('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <Notification type="success" message={message} />
      )}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Tasoko Integration</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">API Token</label>
          <Input value={apiToken} onChange={(e: any) => setApiToken(e.target.value)} placeholder="APITOKEN used by Tasoko" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Default Branch</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="Main">Main</option>
            <option value="Down Town">Down Town</option>
            <option value="Airport">Airport</option>
          </select>
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
        </div>
      </Card>
    </div>
  )
}


