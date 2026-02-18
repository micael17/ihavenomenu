import { useDB, type DishWithIngredients } from '../../utils/db'
import { getLocale } from '../../utils/locale'

const PAGE_SIZE = 12
const MAX_LIMIT = 50

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { maxRequests: 30, windowMs: 60000 })

  const query = getQuery(event)
  const ingredientNames = (query.ingredients as string || '').split(',').filter(Boolean)
  const offset = Math.max(0, parseInt(query.offset as string) || 0)
  const limit = Math.min(Math.max(1, parseInt(query.limit as string) || PAGE_SIZE), MAX_LIMIT)
  const cuisine = (query.cuisine as string) || 'mixed'
  const locale = getLocale(event)

  if (ingredientNames.length === 0) {
    return { dishes: [], total: 0, hasMore: false }
  }

  try {
    const db = useDB()

    // 1. 입력된 재료명으로 기본 재료 ID 찾기 (name + aliases 양쪽 체크)
    const ingredientPlaceholders = ingredientNames.map(() => '?').join(',')
    const aliasConditions = ingredientNames.map(() => `json_extract(aliases, '$[0]') = ? COLLATE NOCASE`).join(' OR ')

    const baseIngredientSQL = `
      SELECT id FROM ingredients
      WHERE is_base = 1 AND (name IN (${ingredientPlaceholders}) OR ${aliasConditions})
    `
    const baseIds = db.prepare(baseIngredientSQL)
      .all(...ingredientNames, ...ingredientNames)
      .map((row: any) => row.id)

    if (baseIds.length === 0) {
      return { dishes: [], total: 0, hasMore: false, searched_ingredients: ingredientNames }
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

    // 3. 사용자 레시피 검색 (우선순위 높음) - 전체 가져오기
    const userRecipes = searchUserRecipesByIngredients(allIngredientIds)
    const userDishes = userRecipes.map((recipe: any) => ({
      id: recipe.id,
      name: recipe.title,
      category: recipe.category,
      image_url: recipe.youtube_thumbnail || recipe.image_url,
      description: recipe.description,
      ingredients: '',
      match_count: recipe.match_count,
      total_count: recipe.total_ingredients,
      isUserRecipe: true,
      creator: {
        nickname: recipe.nickname,
        channelName: recipe.channel_name,
        profileImage: recipe.profile_image
      },
      youtubeVideoId: recipe.youtube_video_id,
      viewCount: recipe.view_count,
      likeCount: recipe.like_count
    }))

    // 4. DB 레시피 총 개수 조회
    const idPlaceholders = allIngredientIds.map(() => '?').join(',')

    const countSQL = `
      SELECT COUNT(DISTINCT d.id) as count
      FROM dishes d
      INNER JOIN dish_ingredients di ON d.id = di.dish_id
      WHERE di.ingredient_id IN (${idPlaceholders})
    `
    const countResult = db.prepare(countSQL).get(...allIngredientIds) as { count: number }
    const totalDbCount = countResult.count

    // 5. DB 레시피 검색 (페이지네이션 적용)
    // 사용자 레시피 개수를 고려하여 offset 조정
    const userRecipeCount = userDishes.length
    let dbOffset = 0
    let dbLimit = limit
    let userSlice: typeof userDishes = []

    if (offset < userRecipeCount) {
      // 아직 사용자 레시피 범위 내
      userSlice = userDishes.slice(offset, offset + limit)
      dbLimit = limit - userSlice.length
      dbOffset = 0
    } else {
      // 사용자 레시피 범위를 벗어남
      dbOffset = offset - userRecipeCount
    }

    let dbDishesWithFlag: any[] = []

    if (dbLimit > 0) {
      // korean: 한글 카테고리(한식) 우선, mixed: 매칭도만 기준
      const cuisineOrder = cuisine === 'korean'
        ? `CASE WHEN d.category GLOB '*[가-힣]*' THEN 0 ELSE 1 END ASC,`
        : ''

      const dishNameField = locale === 'en'
        ? `COALESCE(d.name_en, d.name) as name`
        : `d.name`
      const ingredientNameField = locale === 'en'
        ? `COALESCE(json_extract(i.aliases, '$[0]'), i.name)`
        : `i.name`

      const searchSQL = `
        SELECT
          d.id,
          ${dishNameField},
          d.category,
          d.image_url,
          d.description,
          GROUP_CONCAT(DISTINCT ${ingredientNameField}) as ingredients,
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
        ORDER BY ${cuisineOrder} match_count DESC, total_count ASC
        LIMIT ? OFFSET ?
      `

      const dbDishes = db.prepare(searchSQL)
        .all(...allIngredientIds, ...allIngredientIds, dbLimit, dbOffset) as DishWithIngredients[]

      dbDishesWithFlag = dbDishes.map(dish => ({
        ...dish,
        ingredients: dish.ingredients ? dish.ingredients.replace(/[\x00-\x1F\x7F]/g, ' ').trim() : '',
        isUserRecipe: false
      }))
    }

    // 6. 결과 합치기
    const dishes = [...userSlice, ...dbDishesWithFlag]
    const totalCount = userRecipeCount + totalDbCount
    const hasMore = offset + dishes.length < totalCount

    return {
      dishes,
      total: totalCount,
      hasMore,
      offset,
      userRecipeCount,
      dbRecipeCount: totalDbCount,
      searched_ingredients: ingredientNames
    }
  } catch (error) {
    console.error('Search error:', error)
    throw createError({
      statusCode: 500,
      message: 'Search failed'
    })
  }
})
