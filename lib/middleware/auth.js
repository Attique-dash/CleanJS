export function requireAuth(handler) {
  return async (req, ...rest) => {
    const auth = req.headers?.authorization || ''
    if (!auth) return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 })
    return handler(req, ...rest)
  }
}


