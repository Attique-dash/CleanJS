// components/forms/CustomerForm.tsx
'use client'

import { useState } from 'react'
import Input from '../ui/input'
import Button from '../ui/Button'
import Notification from '../ui/Notification'

type Props = {
  onSaved?: () => void
}

export default function CustomerForm({ onSaved }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [branch, setBranch] = useState('Main')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    try {
      setSaving(true)
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone, branch })
      })
      const data = await res.json()
      if (data.success) {
        setMsg('Customer saved')
        setFirstName(''); setLastName(''); setEmail(''); setPhone('')
        if (onSaved) onSaved()
      } else setMsg(data.message || 'Failed to save')
    } catch (e) {
      setMsg('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {msg && <Notification type="success" message={msg} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">First Name</label>
          <Input value={firstName} onChange={(e: any) => setFirstName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Last Name</label>
          <Input value={lastName} onChange={(e: any) => setLastName(e.target.value)} required />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <Input type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Phone</label>
          <Input value={phone} onChange={(e: any) => setPhone(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Branch</label>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-md" value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="Main">Main</option>
          <option value="Down Town">Down Town</option>
          <option value="Airport">Airport</option>
        </select>
      </div>
      <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Customer'}</Button>
    </form>
  )
}


