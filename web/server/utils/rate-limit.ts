const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const CLEANUP_INTERVAL = 60000 // 1분마다 만료 항목 정리
const MAX_STORE_SIZE = 10000 // 메모리 보호: 최대 항목 수
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

  // 메모리 보호: 항목 수 초과 시 가장 오래된 항목부터 제거
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const entries = [...rateLimitStore.entries()]
      .sort((a, b) => a[1].resetTime - b[1].resetTime)
    const toDelete = entries.slice(0, entries.length - MAX_STORE_SIZE)
    for (const [key] of toDelete) {
      rateLimitStore.delete(key)
    }
  }
}

export function checkRateLimit(event: any, { maxRequests = 10, windowMs = 60000 } = {}): void {
  // production에서는 multiplier 최대 1 (rate limit 완화 방지)
  const isProduction = process.env.NODE_ENV === 'production'
  const rawMultiplier = parseInt(process.env.NUXT_RATE_LIMIT_MULTIPLIER || '1')
  const multiplier = isProduction ? Math.min(rawMultiplier, 1) : rawMultiplier
  maxRequests = maxRequests * multiplier
  cleanup()

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'

  // IP를 식별할 수 없는 경우 더 엄격한 제한 적용
  if (ip === 'unknown') {
    maxRequests = Math.max(1, Math.floor(maxRequests / 2))
  }

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
