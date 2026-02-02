import { useDB, type DishWithIngredients } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const ingredientNames = (query.ingredients as string || '').split(',').filter(Boolean)

  if (ingredientNames.length === 0) {
    return { dishes: [], total: 0 }
  }

  try {
    const db = useDB()

    // 1. 입력된 재료명으로 기본 재료 ID 찾기
    const ingredientPlaceholders = ingredientNames.map(() => '?').join(',')

    const baseIngredientSQL = `
      SELECT id FROM ingredients
      WHERE is_base = 1 AND name IN (${ingredientPlaceholders})
    `
    const baseIds = db.prepare(baseIngredientSQL)
      .all(...ingredientNames)
      .map((row: any) => row.id)

    if (baseIds.length === 0) {
      return { dishes: [], total: 0, searched_ingredients: ingredientNames }
    }

    // 2. 기본 재료 + 그 하위 재료들의 ID 모으기
    const baseIdPlaceholders = baseIds.map(() => '?').join(',')
    const allIngredientSQL = `
      SELECT id FROM ingredients
      WHERE id IN (${baseIdPlaceholders})
         OR parent_id IN (${baseIdPlaceholders})
    `
    const allIngredientIds = db.prepare(allIngredientSQL)
      .all(...baseIds, ...baseIds)
      .map((row: any) => row.id)

    // 3. 해당 재료들을 사용하는 요리 찾기
    const idPlaceholders = allIngredientIds.map(() => '?').join(',')

    const searchSQL = `
      SELECT
        d.id,
        d.name,
        d.category,
        d.image_url,
        d.description,
        GROUP_CONCAT(DISTINCT i.name) as ingredients,
        COUNT(DISTINCT CASE WHEN di.ingredient_id IN (${idPlaceholders}) THEN di.ingredient_id END) as match_count,
        COUNT(DISTINCT di.ingredient_id) as total_count
      FROM dishes d
      INNER JOIN dish_ingredients di ON d.id = di.dish_id
      INNER JOIN ingredients i ON di.ingredient_id = i.id
      WHERE d.id IN (
        SELECT DISTINCT dish_id
        FROM dish_ingredients
        WHERE ingredient_id IN (${idPlaceholders})
      )
      GROUP BY d.id
      ORDER BY match_count DESC, total_count ASC
      LIMIT 50
    `

    const dishes = db.prepare(searchSQL)
      .all(...allIngredientIds, ...allIngredientIds) as DishWithIngredients[]

    return {
      dishes,
      total: dishes.length,
      searched_ingredients: ingredientNames,
      matched_ingredient_ids: allIngredientIds.length
    }
  } catch (error) {
    console.error('Search error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Search failed'
    })
  }
})
