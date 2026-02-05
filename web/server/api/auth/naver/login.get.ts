import { randomBytes } from 'crypto'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  if (!config.naverClientId) {
    throw createError({
      statusCode: 500,
      message: '네이버 로그인 설정이 되어있지 않습니다'
    })
  }

  // CSRF 방지를 위한 state 생성
  const state = randomBytes(16).toString('hex')

  const naverAuthUrl = new URL('https://nid.naver.com/oauth2.0/authorize')
  naverAuthUrl.searchParams.set('response_type', 'code')
  naverAuthUrl.searchParams.set('client_id', config.naverClientId)
  naverAuthUrl.searchParams.set('redirect_uri', config.naverRedirectUri)
  naverAuthUrl.searchParams.set('state', state)

  return sendRedirect(event, naverAuthUrl.toString())
})
