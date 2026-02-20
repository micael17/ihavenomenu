import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie, createError } from 'h3'
import { findUserById, type User } from './user-db'

const TOKEN_NAME = 'ihavenomenu_token'
const TOKEN_MAX_AGE = 60 * 60 * 24 * 1 // 1일
let jwtSecretWarned = false

// 로그아웃된 토큰 블랙리스트 (메모리 기반)
const tokenBlacklist = new Map<string, number>() // token -> expiry timestamp
const BLACKLIST_CLEANUP_INTERVAL = 60 * 60 * 1000 // 1시간마다 정리
let lastBlacklistCleanup = Date.now()

function cleanupBlacklist() {
  const now = Date.now()
  if (now - lastBlacklistCleanup < BLACKLIST_CLEANUP_INTERVAL) return
  lastBlacklistCleanup = now

  for (const [token, expiry] of tokenBlacklist) {
    if (now > expiry * 1000) {
      tokenBlacklist.delete(token)
    }
  }
}

export function revokeToken(token: string): void {
  const payload = verifyToken(token)
  if (payload) {
    tokenBlacklist.set(token, payload.exp)
  }
}

export function isTokenRevoked(token: string): boolean {
  cleanupBlacklist()
  return tokenBlacklist.has(token)
}

export interface JwtPayload {
  userId: number
  iat: number
  exp: number
}

export function createToken(userId: number): string {
  const config = useRuntimeConfig()
  const isDefaultSecret = config.jwtSecret === 'ihavenomenu-secret-key-change-in-production'

  if (isDefaultSecret && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET must be set in production. Server cannot issue tokens with default secret.')
  }

  if (!jwtSecretWarned && isDefaultSecret) {
    console.warn('[AUTH] ⚠️  WARNING: Using default JWT secret! Set JWT_SECRET environment variable for production.')
    jwtSecretWarned = true
  }

  return jwt.sign(
    { userId },
    config.jwtSecret,
    { expiresIn: '1d' }
  )
}

export function verifyToken(token: string): JwtPayload | null {
  const config = useRuntimeConfig()
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload
  } catch {
    return null
  }
}

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/'
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, TOKEN_NAME, {
    path: '/'
  })
}

export function getAuthToken(event: H3Event): string | null {
  return getCookie(event, TOKEN_NAME) || null
}

export function getCurrentUser(event: H3Event): User | null {
  const token = getAuthToken(event)
  if (!token) return null

  // 블랙리스트 체크 (로그아웃된 토큰 거부)
  if (isTokenRevoked(token)) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = findUserById(payload.userId)
  return user || null
}

export function requireAuth(event: H3Event): User {
  const user = getCurrentUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '로그인이 필요합니다'
    })
  }
  return user
}
