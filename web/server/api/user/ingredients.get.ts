export default defineEventHandler((event) => {
  const user = requireAuth(event)

  const ingredients = getUserIngredients(user.id)
  const expiring = getExpiringIngredients(user.id)

  return {
    ingredients,
    expiring
  }
})
