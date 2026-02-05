interface KakaoTokenResponse {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
}

interface KakaoUserResponse {
  id: number
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
  const tokenResponse = await $fetch<KakaoTokenResponse>('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.kakaoClientId,
      client_secret: config.kakaoClientSecret || '',
      redirect_uri: config.kakaoRedirectUri,
      code
    }).toString()
  })

  // 2. 사용자 정보 조회 (ID만 필요)
  const userResponse = await $fetch<KakaoUserResponse>('https://kapi.kakao.com/v2/user/me', {
    headers: {
      Authorization: `Bearer ${tokenResponse.access_token}`
    }
  })

  const providerId = String(userResponse.id)

  // 3. 사용자 생성 또는 조회
  const { user, isNew } = findOrCreateUser('kakao', providerId)

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
