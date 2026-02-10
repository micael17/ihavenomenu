export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  // 이미 크리에이터인지 확인
  const existing = getCreatorByUserId(user.id)
  if (existing) {
    return { creator: existing, isNew: false }
  }

  const body = await readBody(event)
  const { youtubeChannelUrl, channelName, channelThumbnail } = body || {}

  const creator = createCreator(
    user.id,
    youtubeChannelUrl,
    channelName,
    channelThumbnail
  )

  return { creator, isNew: true }
})
