// components/ui/Notification.tsx
'use client'

type Props = {
  type?: 'success' | 'info' | 'warning' | 'error'
  message: string
}

const styles: Record<NonNullable<Props['type']>, string> = {
  success: 'bg-green-50 text-green-800 border-green-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  error: 'bg-red-50 text-red-800 border-red-200'
}

export default function Notification({ type = 'info', message }: Props) {
  return (
    <div className={`border rounded-md px-4 py-2 ${styles[type]}`}>
      {message}
    </div>
  )
}


