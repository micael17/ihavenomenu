export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  if (!config.kakaoClientId) {
    throw createError({
      statusCode: 500,
      message: '카카오 로그인 설정이 되어있지 않습니다'
    })
  }

  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize')
  kakaoAuthUrl.searchParams.set('client_id', config.kakaoClientId)
  kakaoAuthUrl.searchParams.set('redirect_uri', config.kakaoRedirectUri)
  kakaoAuthUrl.searchParams.set('response_type', 'code')

  return sendRedirect(event, kakaoAuthUrl.toString())
})
