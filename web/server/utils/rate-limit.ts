const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const CLEANUP_INTERVAL = 60000 // 1분마다 만료 항목 정리
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, record] of rateLimitStore) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

export function checkRateLimit(event: any, { maxRequests = 10, windowMs = 60000 } = {}): void {
  const multiplier = parseInt(process.env.NUXT_RATE_LIMIT_MULTIPLIER || '1')
  maxRequests = maxRequests * multiplier
  cleanup()

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const path = getRequestPath(event) || 'unknown'
  const key = `${ip}:${path}`
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return
  }

  record.count++
  if (record.count > maxRequests) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.'
    })
  }
}
