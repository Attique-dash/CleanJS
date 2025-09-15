// components/tracking/TrackingForm.tsx
'use client'

import { useState } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'

type Props = {
  onResult: (trackingNumber: string) => void
}

export default function TrackingForm({ onResult }: Props) {
  const [trackingNumber, setTrackingNumber] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber) return
    onResult(trackingNumber)
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input placeholder="Enter tracking number" value={trackingNumber} onChange={(e: any) => setTrackingNumber(e.target.value)} />
      <Button type="submit">Track</Button>
    </form>
  )
}
