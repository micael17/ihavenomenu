interface NaverTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

interface NaverUserResponse {
  response: {
    id: string
  }
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
  const tokenUrl = new URL('https://nid.naver.com/oauth2.0/token')
  tokenUrl.searchParams.set('grant_type', 'authorization_code')
  tokenUrl.searchParams.set('client_id', config.naverClientId)
  tokenUrl.searchParams.set('client_secret', config.naverClientSecret)
  tokenUrl.searchParams.set('code', code)
  tokenUrl.searchParams.set('state', query.state as string || '')

  const tokenResponse = await $fetch<NaverTokenResponse>(tokenUrl.toString())

  // 2. 사용자 정보 조회 (ID만 필요)
  const userResponse = await $fetch<NaverUserResponse>('https://openapi.naver.com/v1/nid/me', {
    headers: {
      Authorization: `Bearer ${tokenResponse.access_token}`
    }
  })

  const providerId = userResponse.response.id

  // 3. 사용자 생성 또는 조회
  const { user, isNew } = findOrCreateUser('naver', providerId)

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
