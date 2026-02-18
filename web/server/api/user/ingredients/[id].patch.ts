interface UpdateIngredientBody {
  expiryDate: string | null
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function validateExpiryDate(date: unknown): string | null {
  if (date === null || date === undefined) return null
  if (typeof date !== 'string') return null
  if (!DATE_REGEX.test(date)) return null
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return null
  return date
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

  const expiryDate = validateExpiryDate(body.expiryDate)

  const result = updateUserIngredientExpiry(user.id, ingredientId, expiryDate)

  return { success: result.updated }
})
