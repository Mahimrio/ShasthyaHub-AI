export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 }
): boolean {
  const now = Date.now()

  for (const [key, entry] of requestCounts) {
    if (now >= entry.resetTime) {
      requestCounts.delete(key)
    }
  }

  const entry = requestCounts.get(identifier)

  if (!entry || now >= entry.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + config.windowMs })
    return true
  }

  if (entry.count < config.maxRequests) {
    entry.count++
    return true
  }

  console.warn('[RateLimit]', {
    userId: identifier,
    timestamp: new Date().toISOString(),
  })
  return false
}
