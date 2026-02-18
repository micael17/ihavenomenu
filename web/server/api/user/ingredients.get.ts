import { getLocale } from '../../utils/locale'

export default defineEventHandler((event) => {
  const user = requireAuth(event)
  const locale = getLocale(event)

  const ingredients = getUserIngredients(user.id, locale)
  const expiring = getExpiringIngredients(user.id, locale)

  return {
    ingredients,
    expiring
  }
})
