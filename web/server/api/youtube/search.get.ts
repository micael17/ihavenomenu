export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = query.q as string
  const ingredients = (query.ingredients as string)?.split(',').map(i => i.trim().toLowerCase()) || []

  if (!searchQuery) {
    throw createError({
      statusCode: 400,
      message: 'Search query required'
    })
  }

  const config = useRuntimeConfig()
  const apiKey = config.youtubeApiKey

  if (!apiKey) {
    return { videos: [], hasApiKey: false }
  }

  try {
    const response = await $fetch<any>(
      'https://www.googleapis.com/youtube/v3/search',
      {
        query: {
          part: 'snippet',
          q: searchQuery,
          type: 'video',
          maxResults: 10,
          order: 'viewCount',
          key: apiKey,
          relevanceLanguage: 'ko',
          regionCode: 'KR'
        }
      }
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
    return { videos: [], hasApiKey: true, error: error.message }
  }
})
