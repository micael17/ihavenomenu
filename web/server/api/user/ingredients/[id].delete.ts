export default defineEventHandler((event) => {
  const user = requireAuth(event)
  const ingredientId = Number(getRouterParam(event, 'id'))

  if (!ingredientId || isNaN(ingredientId)) {
    throw createError({
      statusCode: 400,
      message: '유효한 재료 ID가 필요합니다'
    })
  }

  const result = removeUserIngredient(user.id, ingredientId)

  return { success: result.deleted }
})
