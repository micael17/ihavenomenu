import bcrypt from 'bcrypt'
import { createEmailUser, findUserByEmail } from '../../utils/user-db'
import { createToken, setAuthCookie } from '../../utils/auth'
import { checkRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { maxRequests: 5, windowMs: 60 * 1000 })

  const body = await readBody<{ email: string; password: string }>(event)

  // 유효성 검사
  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
    })
  }

  // 이메일 검사
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (body.email.length > 64 || !emailRegex.test(body.email)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid email format'
    })
  }

  // 비밀번호 길이 검사
  if (body.password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'Password must be at least 8 characters'
    })
  }

  if (body.password.length > 16) {
    throw createError({
      statusCode: 400,
      message: 'Password must be at most 16 characters'
    })
  }

  // 이메일 중복 체크 - 타이밍 공격 방지를 위해 항상 해싱 수행
  const existing = findUserByEmail(body.email)
  const passwordHash = await bcrypt.hash(body.password, 10)

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Registration failed. Please try again or log in.'
    })
  }

  // 유저 생성
  const { user } = createEmailUser(body.email, passwordHash)

  // JWT 토큰 생성 + 쿠키 설정
  const token = createToken(user.id)
  setAuthCookie(event, token)

  return {
    user: {
      id: user.id,
      email: user.email,
      provider: user.provider,
      onboarding_completed: false
    },
    redirectTo: '/onboarding'
  }
})
