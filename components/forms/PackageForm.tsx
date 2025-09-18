// components/forms/PackageForm.tsx
'use client'

import { useState } from 'react'
import Input from '../ui/input'
import Button from '../ui/Button'
import Notification from '../ui/Notification'

type Props = {
  onSaved?: () => void
}

export default function PackageForm({ onSaved }: Props) {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [controlNumber, setControlNumber] = useState('')
  const [userCode, setUserCode] = useState('')
  const [weight, setWeight] = useState<number | ''>('')
  const [shipper, setShipper] = useState('')
  const [branch, setBranch] = useState('Main')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    try {
      setSaving(true)
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber, controlNumber, userCode, weight: Number(weight || 0), shipper, branch, description })
      })
      const data = await res.json()
      if (data.success) {
        setMsg('Package saved')
        setTrackingNumber(''); setControlNumber(''); setUserCode(''); setWeight(''); setShipper(''); setDescription('')
        if (onSaved) onSaved()
      } else setMsg(data.message || 'Failed to save package')
    } catch (e) {
      setMsg('Failed to save package')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {msg && <Notification type="success" message={msg} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Tracking Number</label>
          <Input value={trackingNumber} onChange={(e: any) => setTrackingNumber(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Control Number</label>
          <Input value={controlNumber} onChange={(e: any) => setControlNumber(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">User Code</label>
          <Input value={userCode} onChange={(e: any) => setUserCode(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Weight (kg)</label>
          <Input type="number" step="0.01" value={weight} onChange={(e: any) => setWeight(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Shipper</label>
          <Input value={shipper} onChange={(e: any) => setShipper(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Branch</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="Main">Main</option>
            <option value="Down Town">Down Town</option>
            <option value="Airport">Airport</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Description</label>
        <Input value={description} onChange={(e: any) => setDescription(e.target.value)} />
      </div>
      <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Package'}</Button>
    </form>
  )
}


