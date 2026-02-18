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

  // 이미 크리에이터인지 확인
  const existing = getCreatorByUserId(user.id)
  if (existing) {
    return { creator: existing, isNew: false }
  }

  const body = await readBody(event)
  const youtubeChannelUrl = validateYoutubeUrl(body?.youtubeChannelUrl)
  const channelName = sanitizeCreatorInput(body?.channelName, 100)
  const channelThumbnail = sanitizeCreatorInput(body?.channelThumbnail, 500)

  const creator = createCreator(
    user.id,
    youtubeChannelUrl,
    channelName,
    channelThumbnail
  )

  return { creator, isNew: true }
})
