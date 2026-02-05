import { YoutubeTranscript } from 'youtube-transcript'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const videoId = query.videoId as string
  const ingredients = (query.ingredients as string)?.split(',').map(i => i.trim().toLowerCase()) || []

  if (!videoId) {
    throw createError({
      statusCode: 400,
      message: 'Video ID required'
    })
  }

  try {
    // 한국어 자막 우선, 없으면 자동 생성 자막
    let transcript
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ko' })
    } catch {
      // 한국어 없으면 기본 자막 시도
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
      error: error.message
    }
  }
})
