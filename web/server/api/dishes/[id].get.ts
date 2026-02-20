import { useDB, type Dish, type Recipe } from '../../utils/db'
import { getLocale } from '../../utils/locale'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid dish ID'
    })
  }

  const db = useDB()
  const locale = getLocale(event)

  const dishNameField = locale === 'en'
    ? `COALESCE(name_en, name) as name`
    : `name`

  // 요리 정보
  const dish = db.prepare(`
    SELECT id, ${dishNameField}, category, image_url, description
    FROM dishes WHERE id = ?
  `).get(Number(id)) as Dish | undefined

  if (!dish) {
    throw createError({
      statusCode: 404,
      message: 'Dish not found'
    })
  }

  // locale에 따른 재료명 필드
  const ingNameExpr = locale === 'en'
    ? `COALESCE(json_extract(i.aliases, '$[0]'), i.name)`
    : `i.name`
  const parentNameExpr = locale === 'en'
    ? `COALESCE(json_extract(parent.aliases, '$[0]'), parent.name)`
    : `parent.name`
  const ingCatExpr = locale === 'en'
    ? `COALESCE(i.category_en, i.category)`
    : `i.category`
  const parentCatExpr = locale === 'en'
    ? `COALESCE(parent.category_en, parent.category)`
    : `parent.category`

  // 이 요리에 사용된 기본 재료만 조회
  const ingredients = db.prepare(`
    SELECT DISTINCT
      CASE
        WHEN i.is_base = 1 THEN i.id
        ELSE parent.id
      END as id,
      CASE
        WHEN i.is_base = 1 THEN ${ingNameExpr}
        ELSE ${parentNameExpr}
      END as name,
      CASE
        WHEN i.is_base = 1 THEN ${ingCatExpr}
        ELSE ${parentCatExpr}
      END as category,
      di.is_main,
      di.is_optional,
      di.amount
    FROM dish_ingredients di
    INNER JOIN ingredients i ON di.ingredient_id = i.id
    LEFT JOIN ingredients parent ON i.parent_id = parent.id AND parent.is_base = 1
    WHERE di.dish_id = ?
      AND (i.is_base = 1 OR parent.id IS NOT NULL)
  `).all(Number(id))

  // 중복 제거 및 null 필터링
  const seen = new Set()
  const uniqueIngredients = ingredients
    .filter((ing: any) => ing.id !== null)
    .filter((ing: any) => {
      if (seen.has(ing.id)) return false
      seen.add(ing.id)
      return true
    })
    .map((ing: any) => ({
      ...ing,
      amount: ing.amount ? ing.amount.replace(/[\x00-\x1F\x7F]/g, ' ').trim() : null
    }))
    .sort((a: any, b: any) => {
      // 카테고리 순, 이름 순 정렬
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '')
      }
      return (a.name || '').localeCompare(b.name || '')
    })

  // 레시피 (1개만) - locale 기반 COALESCE
  const recipeTitleField = locale === 'en'
    ? 'COALESCE(title_en, title) as title'
    : 'title'
  const recipeDescField = locale === 'en'
    ? 'COALESCE(description_en, description) as description'
    : 'description'
  const recipeIngredientsRawField = locale === 'en'
    ? 'COALESCE(ingredients_raw_en, ingredients_raw) as ingredients_raw'
    : 'ingredients_raw'
  const recipeCookingMethodField = locale === 'en'
    ? 'COALESCE(cooking_method_en, cooking_method) as cooking_method'
    : 'cooking_method'
  const recipeCookingStepsField = locale === 'en'
    ? 'COALESCE(cooking_steps_en, cooking_steps) as cooking_steps'
    : 'cooking_steps'

  const recipes = db.prepare(`
    SELECT
      id, dish_id, ${recipeTitleField}, source, ${recipeDescField},
      ${recipeIngredientsRawField}, ${recipeCookingStepsField},
      ${recipeCookingMethodField}, cooking_time,
      servings, difficulty, image_url
    FROM recipes
    WHERE dish_id = ?
    ORDER BY recommend_count DESC, view_count DESC
    LIMIT 1
  `).all(Number(id)) as Recipe[]

  return {
    dish,
    ingredients: uniqueIngredients,
    recipes
  }
})
