import { useDB, type Dish, type Recipe } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: 'Invalid dish ID'
    })
  }

  const db = useDB()

  // 요리 정보
  const dish = db.prepare(`
    SELECT id, name, category, image_url, description
    FROM dishes WHERE id = ?
  `).get(Number(id)) as Dish | undefined

  if (!dish) {
    throw createError({
      statusCode: 404,
      message: 'Dish not found'
    })
  }

  // 이 요리에 사용된 기본 재료만 조회
  const ingredients = db.prepare(`
    SELECT DISTINCT
      CASE
        WHEN i.is_base = 1 THEN i.id
        ELSE parent.id
      END as id,
      CASE
        WHEN i.is_base = 1 THEN i.name
        ELSE parent.name
      END as name,
      CASE
        WHEN i.is_base = 1 THEN i.category
        ELSE parent.category
      END as category
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
    .sort((a: any, b: any) => {
      // 카테고리 순, 이름 순 정렬
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '')
      }
      return (a.name || '').localeCompare(b.name || '')
    })

  // 레시피 (1개만)
  const recipes = db.prepare(`
    SELECT
      id, dish_id, title, source, description,
      ingredients_raw, cooking_method, cooking_time,
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
