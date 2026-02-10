export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const creator = getCreatorByUserId(user.id)
  if (!creator) {
    return { recipes: [], creator: null }
  }

  const recipes = getUserRecipesByCreator(creator.id)

  return { recipes, creator }
})
