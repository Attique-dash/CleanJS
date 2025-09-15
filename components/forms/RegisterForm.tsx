// components/forms/RegisterForm.tsx
'use client'

import { useState } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Notification from '../ui/Notification'

export default function RegisterForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      setLoading(true)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password })
      })
      const data = await res.json()
      if (data.success) setMessage('Registration successful. You can now log in.')
      else setMessage(data.message || 'Registration failed')
    } catch (e) {
      setMessage('Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message && <Notification type="info" message={message} />}
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
      <div>
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <Input type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Password</label>
        <Input type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</Button>
    </form>
  )
}


