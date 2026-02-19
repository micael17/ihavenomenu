import { useDB, type DishWithIngredients } from '../../utils/db'
import { getLocale } from '../../utils/locale'

const PAGE_SIZE = 24
const MAX_LIMIT = 50

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { maxRequests: 60, windowMs: 60000 })

  const query = getQuery(event)
  const ingredientIds = (query.ids as string || '').split(',').filter(Boolean).map(Number).filter(id => !isNaN(id) && id > 0)
  const offset = Math.max(0, parseInt(query.offset as string) || 0)
  const limit = Math.min(Math.max(1, parseInt(query.limit as string) || PAGE_SIZE), MAX_LIMIT)
  const cuisine = (query.cuisine as string) || 'mixed'
  const subCategory = (query.subCategory as string) || ''
  const locale = getLocale(event)

  if (ingredientIds.length === 0) {
    return { userDishes: [], dbDishes: [], total: 0, dbTotal: 0, hasMore: false }
  }

  try {
    const db = useDB()

    // 1. 전달받은 ID → base 재료 ID로 해석
    //    is_base=1이면 그대로, is_base=0이면 같은 name_ko를 가진 base 재료로 매핑
    const idPlaceholdersInput = ingredientIds.map(() => '?').join(',')
    const baseIngredientSQL = `
      SELECT DISTINCT COALESCE(base.id, a.id) as id
      FROM ingredients a
      LEFT JOIN ingredients base ON a.name_ko = base.name_ko AND base.is_base = 1 AND a.is_base = 0
      WHERE a.id IN (${idPlaceholdersInput})
        AND (a.is_base = 1 OR base.id IS NOT NULL)
    `
    const baseIds = db.prepare(baseIngredientSQL)
      .all(...ingredientIds)
      .map((row: any) => row.id)

    if (baseIds.length === 0) {
      return { userDishes: [], dbDishes: [], total: 0, dbTotal: 0, hasMore: false }
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
      total_count: baseIds.length,
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

    // 4. 스타일별 카테고리 필터 매핑
    const cuisineCategoryMap: Record<string, string[]> = {
      korean: ['밑반찬', '메인반찬', '밥/죽/떡', '국/탕', '찌개', '김치/젓갈/장류', '면/만두'],
      western: ['양식', 'Main', 'Side Dish', '스프', '샐러드'],
      dessert: ['디저트', 'Dessert', '빵', '과자']
    }
    // subCategory가 있으면 해당 카테고리 1개로 필터, 없으면 cuisine 그룹 전체
    const cuisineCategories = subCategory
      ? [subCategory]
      : (cuisineCategoryMap[cuisine] || null)
    const cuisineFilter = cuisineCategories
      ? `AND d.category IN (${cuisineCategories.map(() => '?').join(',')})`
      : ''
    const cuisineParams = cuisineCategories || []

    // 5. DB 레시피 총 개수 조회
    const idPlaceholders = allIngredientIds.map(() => '?').join(',')

    const countSQL = `
      SELECT COUNT(DISTINCT d.id) as count
      FROM dishes d
      INNER JOIN dish_ingredients di ON d.id = di.dish_id
      WHERE di.ingredient_id IN (${idPlaceholders})
        ${cuisineFilter}
    `
    const countResult = db.prepare(countSQL).get(...allIngredientIds, ...cuisineParams) as { count: number }
    const totalDbCount = countResult.count

    // 6. DB 레시피 검색 (페이지네이션은 DB 레시피에만 적용)
    const dishNameField = locale === 'en'
      ? `COALESCE(d.name_en, d.name) as name`
      : `d.name`
    const ingredientNameField = locale === 'en'
      ? `COALESCE(json_extract(i.aliases, '$[0]'), i.name)`
      : `i.name`

    const baseIdPlaceholdersForMatch = baseIds.map(() => '?').join(',')

    const searchSQL = `
      SELECT
        d.id,
        ${dishNameField},
        d.category,
        d.image_url,
        d.description,
        GROUP_CONCAT(DISTINCT ${ingredientNameField}) as ingredients,
        COUNT(DISTINCT CASE
          WHEN di.ingredient_id IN (${idPlaceholders}) THEN
            CASE WHEN i.parent_id IN (${baseIdPlaceholdersForMatch}) THEN i.parent_id ELSE i.id END
        END) as match_count,
        COUNT(DISTINCT di.ingredient_id) as dish_ingredient_count
      FROM dishes d
      INNER JOIN dish_ingredients di ON d.id = di.dish_id
      INNER JOIN ingredients i ON di.ingredient_id = i.id
      WHERE d.id IN (
        SELECT DISTINCT dish_id
        FROM dish_ingredients
        WHERE ingredient_id IN (${idPlaceholders})
      )
        ${cuisineFilter}
      GROUP BY d.id
      ORDER BY match_count DESC, dish_ingredient_count ASC
      LIMIT ? OFFSET ?
    `

    const dbDishes = db.prepare(searchSQL)
      .all(...allIngredientIds, ...baseIds, ...allIngredientIds, ...cuisineParams, limit, offset) as DishWithIngredients[]

    const dbDishesWithFlag = dbDishes.map(dish => ({
      ...dish,
      total_count: baseIds.length,
      ingredients: dish.ingredients ? dish.ingredients.replace(/[\x00-\x1F\x7F]/g, ' ').trim() : '',
      isUserRecipe: false
    }))

    const hasMore = offset + dbDishesWithFlag.length < totalDbCount

    return {
      userDishes,
      dbDishes: dbDishesWithFlag,
      total: userDishes.length + totalDbCount,
      dbTotal: totalDbCount,
      hasMore,
      offset,
      searched_ids: ingredientIds
    }
  } catch (error) {
    console.error('Search error:', error)
    throw createError({
      statusCode: 500,
      message: 'Search failed'
    })
  }
})
