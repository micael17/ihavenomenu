interface UpdateIngredientBody {
  expiryDate: string | null
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const ingredientId = Number(getRouterParam(event, 'id'))
  const body = await readBody<UpdateIngredientBody>(event)

  if (!ingredientId || isNaN(ingredientId)) {
    throw createError({
      statusCode: 400,
      message: '유효한 재료 ID가 필요합니다'
    })
  }

  const result = updateUserIngredientExpiry(user.id, ingredientId, body.expiryDate)

  return { success: result.updated }
})
