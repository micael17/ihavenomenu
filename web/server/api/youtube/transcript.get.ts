import { YoutubeTranscript } from 'youtube-transcript'
import { getLocale } from '../../utils/locale'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  checkRateLimit(event, { maxRequests: 20, windowMs: 60000 })

  const query = getQuery(event)
  const videoId = query.videoId as string
  const ingredients = (query.ingredients as string)?.split(',').map(i => i.trim().toLowerCase()) || []
  const locale = getLocale(event)

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    throw createError({
      statusCode: 400,
      message: 'Valid Video ID required'
    })
  }

  try {
    // locale에 따라 자막 언어 우선순위 변경
    const preferredLang = locale === 'en' ? 'en' : 'ko'
    let transcript
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: preferredLang })
    } catch {
      // 선호 언어 없으면 기본 자막 시도
      transcript = await YoutubeTranscript.fetchTranscript(videoId)
    }

    if (!transcript || transcript.length === 0) {
      return {
        videoId,
        hasTranscript: false,
        ingredientMatch: null
      }
    }

    // 전체 자막 텍스트 합치기
    const fullText = transcript.map(t => t.text).join(' ').toLowerCase()

    // 재료 매칭
    const matchedIngredients = ingredients.filter(ing => fullText.includes(ing))

    return {
      videoId,
      hasTranscript: true,
      ingredientMatch: {
        matched: matchedIngredients,
        count: matchedIngredients.length,
        total: ingredients.length,
        verified: true
      }
    }
  } catch (error: any) {
    // 자막 없는 경우
    return {
      videoId,
      hasTranscript: false,
      ingredientMatch: null,
      error: 'Transcript fetch failed'
    }
  }
})
