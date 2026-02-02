export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = query.q as string

  if (!searchQuery) {
    throw createError({
      statusCode: 400,
      message: 'Search query required'
    })
  }

  const config = useRuntimeConfig()
  const apiKey = config.youtubeApiKey

  if (!apiKey) {
    // API 키 없으면 빈 결과 반환 (링크 폴백용)
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
          maxResults: 5,
          key: apiKey,
          relevanceLanguage: 'ko',
          regionCode: 'KR'
        }
      }
    )

    const videos = response.items?.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    })) || []

    return { videos, hasApiKey: true }
  } catch (error: any) {
    console.error('YouTube API error:', error)
    return { videos: [], hasApiKey: true, error: error.message }
  }
})
