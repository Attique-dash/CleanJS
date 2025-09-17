const buckets = new Map()

export function withRateLimit({ windowMs = 60_000, max = 60 } = {}, handler) {
  return async (req, ...rest) => {
    const key = (req.headers?.['x-forwarded-for'] || req.ip || 'global') + (req.url || '')
    const now = Date.now()
    const bucket = buckets.get(key) || { count: 0, reset: now + windowMs }
    if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + windowMs }
    bucket.count++
    buckets.set(key, bucket)
    if (bucket.count > max) {
      return new Response(JSON.stringify({ success: false, error: 'Too many requests' }), { status: 429 })
    }
    return handler(req, ...rest)
  }
}


