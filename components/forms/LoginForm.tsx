// components/forms/LoginForm.tsx
'use client'

import { useState } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Notification from '../ui/Notification'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      setLoading(true)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!data.success) setError(data.message || 'Login failed')
      else window.location.href = '/dashboard'
    } catch (e) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Notification type="error" message={error} />}
      <div>
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <Input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Password</label>
        <Input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
    </form>
  )
}


