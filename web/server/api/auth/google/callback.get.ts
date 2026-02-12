interface GoogleTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  id_token: string
}

interface GoogleUserResponse {
  sub: string  // Google의 고유 사용자 ID
  email?: string
  name?: string
  picture?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const code = query.code as string
  if (!code) {
    throw createError({
      statusCode: 400,
      message: '인증 코드가 없습니다'
    })
  }

  // 1. 토큰 교환
  const tokenResponse = await $fetch<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleRedirectUri,
      code
    }).toString()
  })

  // 2. 사용자 정보 조회
  const userResponse = await $fetch<GoogleUserResponse>('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenResponse.access_token}`
    }
  })

  const providerId = userResponse.sub

  // 3. 사용자 생성 또는 조회
  const { user, isNew } = findOrCreateUser('google', providerId)

  // 4. JWT 토큰 생성 및 쿠키 설정
  const token = createToken(user.id)
  setAuthCookie(event, token)

  // 5. 새 사용자 또는 온보딩 미완료 시 온보딩으로 리다이렉트
  if (isNew || !user.onboarding_completed) {
    return sendRedirect(event, '/onboarding')
  }

  // 6. 기존 사용자는 홈으로 리다이렉트
  return sendRedirect(event, '/')
})
