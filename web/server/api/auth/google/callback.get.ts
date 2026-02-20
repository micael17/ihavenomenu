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

  // CSRF 방지: state 검증
  const state = query.state as string
  const savedState = getCookie(event, 'oauth_state')
  deleteCookie(event, 'oauth_state', { path: '/' })

  if (!state || !savedState || state !== savedState) {
    throw createError({
      statusCode: 403,
      message: '잘못된 인증 요청입니다 (state mismatch)'
    })
  }

  const code = query.code as string
  if (!code) {
    throw createError({
      statusCode: 400,
      message: '인증 코드가 없습니다'
    })
  }

  // 1. 토큰 교환
  let tokenResponse: GoogleTokenResponse
  try {
    tokenResponse = await $fetch<GoogleTokenResponse>('https://oauth2.googleapis.com/token', {
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
  } catch {
    throw createError({
      statusCode: 502,
      message: 'Google 인증 서버 연결에 실패했습니다'
    })
  }

  // 2. 사용자 정보 조회
  let userResponse: GoogleUserResponse
  try {
    userResponse = await $fetch<GoogleUserResponse>('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`
      }
    })
  } catch {
    throw createError({
      statusCode: 502,
      message: 'Google 사용자 정보 조회에 실패했습니다'
    })
  }

  const providerId = userResponse.sub

  // 3. 이메일 충돌 체크: 같은 이메일로 이메일 가입된 계정이 있는지 확인
  if (userResponse.email) {
    const existingByEmail = findUserByEmailAnyProvider(userResponse.email)
    if (existingByEmail && !(existingByEmail.provider === 'google' && existingByEmail.provider_id === providerId)) {
      // 다른 계정(이메일 가입)에서 이미 사용 중인 이메일
      return sendRedirect(event, '/login?error=email_conflict')
    }
  }

  // 4. 사용자 생성 또는 조회
  const { user, isNew } = findOrCreateUser('google', providerId)

  // Google 프로필 정보 업데이트 (매 로그인 시 최신 정보로 갱신)
  updateUserProfile(user.id, {
    email: userResponse.email,
    nickname: user.nickname || userResponse.name,  // 기존 닉네임이 있으면 유지
    profileImage: userResponse.picture
  })

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
