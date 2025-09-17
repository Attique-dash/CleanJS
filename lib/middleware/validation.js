export function withValidation(validate, handler) {
  return async (req, ...rest) => {
    try {
      const bodyText = await req.text()
      const body = bodyText ? JSON.parse(bodyText) : {}
      const value = validate(body)
      req.body = value
      return handler(req, ...rest)
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message || 'Invalid payload' }), { status: 400 })
    }
  }
}


