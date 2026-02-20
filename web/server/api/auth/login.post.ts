import bcrypt from 'bcrypt'
import { findUserByEmail } from '../../utils/user-db'
import { createToken, setAuthCookie } from '../../utils/auth'
import { checkRateLimit } from '../../utils/rate-limit'

// 타이밍 공격 방지용 유효한 bcrypt 해시 (서버 시작 시 1회 생성)
const DUMMY_HASH = bcrypt.hashSync('__dummy_password_never_match__', 10)

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { maxRequests: 10, windowMs: 60 * 1000 })

  const body = await readBody<{ email: string; password: string }>(event)

  if (!body.email || !body.password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
    })
  }

  if (body.email.length > 64 || body.password.length > 16) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password'
    })
  }

  // 유저 조회 (이메일 정규화)
  const user = findUserByEmail(body.email.toLowerCase().trim())
  // 타이밍 공격 방지: 유저가 없어도 bcrypt 비교 수행
  const hashToCompare = user?.password_hash || DUMMY_HASH
  const isValid = await bcrypt.compare(body.password, hashToCompare)
  if (!user || !user.password_hash || !isValid) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password'
    })
  }

  // JWT 토큰 생성 + 쿠키 설정
  const token = createToken(user.id)
  setAuthCookie(event, token)

  return {
    user: {
      id: user.id,
      nickname: user.nickname,
      email: user.email,
      provider: user.provider,
      onboarding_completed: !!user.onboarding_completed
    },
    redirectTo: user.onboarding_completed ? '/' : '/onboarding'
  }
})
