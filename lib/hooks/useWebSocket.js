'use client'

import { useEffect, useRef } from 'react'

export default function useWebSocket(url, onMessage) {
  const wsRef = useRef(null)

  useEffect(() => {
    if (!url) return
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onmessage = (ev) => {
      try { onMessage?.(JSON.parse(ev.data)) } catch { onMessage?.(ev.data) }
    }
    return () => { try { ws.close() } catch {} }
  }, [url, onMessage])

  return wsRef
}


