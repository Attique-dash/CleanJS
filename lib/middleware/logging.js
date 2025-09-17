export function withLogging(handler) {
  return async (req, ...rest) => {
    const start = Date.now()
    const res = await handler(req, ...rest)
    const ms = Date.now() - start
    try {
      console.log(`${req.method || 'FUNC'} ${req.url || ''} -> ${res.status || 200} ${ms}ms`)
    } catch {}
    return res
  }
}


