function sanitizeCreatorInput(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  return value.replace(/<[^>]*>/g, '').trim().slice(0, maxLength) || undefined
}

function validateYoutubeUrl(url: unknown): string | undefined {
  if (typeof url !== 'string') return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined
  try {
    const parsed = new URL(trimmed)
    if (!['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(parsed.hostname)) {
      return undefined
    }
    return trimmed.slice(0, 200)
  } catch {
    return undefined
  }
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const creator = getCreatorByUserId(user.id)
  if (!creator) {
    throw createError({
      statusCode: 404,
      message: '크리에이터로 등록되지 않았습니다'
    })
  }

  const body = await readBody(event)

  updateCreator(creator.id, {
    youtube_channel_url: validateYoutubeUrl(body?.youtubeChannelUrl),
    channel_name: sanitizeCreatorInput(body?.channelName, 100),
    channel_thumbnail: sanitizeCreatorInput(body?.channelThumbnail, 500)
  })

  return { success: true }
})
