import { getLocale } from '../../utils/locale'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  checkRateLimit(event, { maxRequests: 10, windowMs: 60000 })

  const query = getQuery(event)
  const searchQuery = query.q as string
  const ingredients = (query.ingredients as string)?.split(',').map(i => i.trim().toLowerCase()) || []
  const locale = getLocale(event)

  if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.length > 200) {
    throw createError({
      statusCode: 400,
      message: 'Valid search query required (max 200 characters)'
    })
  }

  const config = useRuntimeConfig()
  const apiKey = config.youtubeApiKey

  if (!apiKey) {
    return { videos: [], hasApiKey: false }
  }

  try {
    const youtubeQuery: Record<string, any> = {
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: 10,
      order: 'viewCount',
      key: apiKey,
      relevanceLanguage: locale === 'en' ? 'en' : 'ko',
    }
    if (locale === 'ko') {
      youtubeQuery.regionCode = 'KR'
    }

    const response = await $fetch<any>(
      'https://www.googleapis.com/youtube/v3/search',
      { query: youtubeQuery }
    )

    const videos = response.items?.map((item: any) => {
      const title = item.snippet.title || ''
      const description = item.snippet.description || ''
      const searchText = `${title} ${description}`.toLowerCase()

      // 1차 검증: title + description에서 재료 매칭
      const matchedIngredients = ingredients.filter(ing => searchText.includes(ing))

      return {
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description,
        ingredientMatch: {
          matched: matchedIngredients,
          count: matchedIngredients.length,
          total: ingredients.length,
          verified: false // 자막 검증 전
        }
      }
    }) || []

    // 재료 일치 개수로 정렬 (많이 일치할수록 상위)
    videos.sort((a: any, b: any) => b.ingredientMatch.count - a.ingredientMatch.count)

    return { videos, hasApiKey: true, ingredients }
  } catch (error: any) {
    console.error('YouTube API error:', error)
    return { videos: [], hasApiKey: true, error: 'YouTube search failed' }
  }
})
