import { useDB } from '../../utils/db'
import { getLocale } from '../../utils/locale'

const PAGE_SIZE = 24
const MAX_LIMIT = 50

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { maxRequests: 30, windowMs: 60000 })

  const query = getQuery(event)
  const offset = Math.max(0, parseInt(query.offset as string) || 0)
  const limit = Math.min(Math.max(1, parseInt(query.limit as string) || PAGE_SIZE), MAX_LIMIT)
  const cuisine = (query.cuisine as string) || 'mixed'
  const locale = getLocale(event)

  try {
    const db = useDB()

    const cuisineCategoryMap: Record<string, string[]> = {
      korean: ['밑반찬', '메인반찬', '밥/죽/떡', '국/탕', '찌개', '김치/젓갈/장류', '면/만두'],
      western: ['양식', 'Main', 'Side Dish', '스프', '샐러드'],
      dessert: ['디저트', 'Dessert', '빵', '과자']
    }

    const cuisineCategories = cuisineCategoryMap[cuisine] || null
    const whereClause = cuisineCategories
      ? `WHERE d.category IN (${cuisineCategories.map(() => '?').join(',')})`
      : ''
    const cuisineParams = cuisineCategories || []

    // 총 개수 조회
    const countSQL = `
      SELECT COUNT(*) as count
      FROM dishes d
      ${whereClause}
    `
    const countResult = db.prepare(countSQL).get(...cuisineParams) as { count: number }
    const total = countResult.count

    // 카테고리별 균등 분배 + 이미지 우선 + 결정적 pseudo-random 정렬
    const dishNameField = locale === 'en'
      ? `COALESCE(d.name_en, d.name) as name`
      : `d.name`

    const searchSQL = `
      SELECT
        id,
        ${dishNameField},
        category,
        image_url,
        description
      FROM (
        SELECT
          d.*,
          ROW_NUMBER() OVER (
            PARTITION BY d.category
            ORDER BY
              CASE WHEN d.image_url IS NOT NULL AND d.image_url != '' THEN 0 ELSE 1 END,
              (d.id * 2654435761) % 2147483647
          ) as rn
        FROM dishes d
        ${whereClause}
      ) d
      ORDER BY rn, (d.id * 2654435761) % 2147483647
      LIMIT ? OFFSET ?
    `

    const dishes = db.prepare(searchSQL)
      .all(...cuisineParams, limit, offset) as any[]

    const hasMore = offset + dishes.length < total

    return {
      dishes,
      total,
      hasMore
    }
  } catch (error) {
    console.error('Popular dishes error:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch popular dishes'
    })
  }
})
