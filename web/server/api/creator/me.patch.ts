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
  const { youtubeChannelUrl, channelName, channelThumbnail } = body || {}

  updateCreator(creator.id, {
    youtube_channel_url: youtubeChannelUrl,
    channel_name: channelName,
    channel_thumbnail: channelThumbnail
  })

  return { success: true }
})
