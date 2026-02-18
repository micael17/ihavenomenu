interface AddIngredientBody {
  ingredientId: number
  expiryDate?: string
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function validateExpiryDate(date: unknown): string | undefined {
  if (!date || typeof date !== 'string') return undefined
  if (!DATE_REGEX.test(date)) return undefined
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return undefined
  return date
}

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readBody<AddIngredientBody>(event)

  if (!body.ingredientId || typeof body.ingredientId !== 'number') {
    throw createError({
      statusCode: 400,
      message: '재료 ID가 필요합니다'
    })
  }

  const expiryDate = validateExpiryDate(body.expiryDate)

  const result = addUserIngredient(user.id, body.ingredientId, expiryDate)

  return { success: true, ...result }
})
