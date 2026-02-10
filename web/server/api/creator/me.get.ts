export default defineEventHandler(async (event) => {
  const user = getCurrentUser(event)

  if (!user) {
    return { creator: null }
  }

  const creator = getCreatorByUserId(user.id)

  return { creator: creator || null }
})
