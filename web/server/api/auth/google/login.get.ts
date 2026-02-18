import crypto from 'crypto'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  if (!config.googleClientId) {
    throw createError({
      statusCode: 500,
      message: 'Google 로그인 설정이 되어있지 않습니다'
    })
  }

  // CSRF 방지용 state 생성
  const state = crypto.randomBytes(32).toString('hex')
  setCookie(event, 'oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10분
    path: '/'
  })

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  googleAuthUrl.searchParams.set('client_id', config.googleClientId)
  googleAuthUrl.searchParams.set('redirect_uri', config.googleRedirectUri)
  googleAuthUrl.searchParams.set('response_type', 'code')
  googleAuthUrl.searchParams.set('scope', 'openid email profile')
  googleAuthUrl.searchParams.set('access_type', 'offline')
  googleAuthUrl.searchParams.set('state', state)

  return sendRedirect(event, googleAuthUrl.toString())
})
