interface AddIngredientBody {
  ingredientId: number
  expiryDate?: string
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody<AddIngredientBody>(event)

  if (!body.ingredientId) {
    throw createError({
      statusCode: 400,
      message: '재료 ID가 필요합니다'
    })
  }

  const result = addUserIngredient(user.id, body.ingredientId, body.expiryDate)

  return { success: true, ...result }
})
