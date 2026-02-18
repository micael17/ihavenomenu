import { useDB, type Ingredient } from '../../utils/db'
import { getLocale } from '../../utils/locale'

interface IngredientWithPopularity extends Ingredient {
  usage_count: number
}

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)
  const category = query.category as string | undefined
  const topLevelOnly = query.topLevelOnly === 'true'
  const orderByPopularity = query.orderByPopularity === 'true'
  const locale = getLocale(event)

  const nameField = locale === 'en'
    ? `COALESCE(json_extract(i.aliases, '$[0]'), i.name) as name`
    : `i.name`
  const categoryField = locale === 'en'
    ? `COALESCE(i.category_en, i.category) as category`
    : `i.category`

  let sql = `
    SELECT i.id, ${nameField}, ${categoryField}, COALESCE(di_count.usage_count, 0) as usage_count
    FROM ingredients i
    LEFT JOIN (
      SELECT ingredient_id, COUNT(*) as usage_count
      FROM dish_ingredients
      GROUP BY ingredient_id
    ) di_count ON i.id = di_count.ingredient_id
    WHERE i.is_base = 1
  `
  const params: string[] = []

  if (category) {
    if (locale === 'en') {
      sql += ` AND (i.category_en = ? OR i.category = ?)`
      params.push(category, category)
    } else {
      sql += ` AND i.category = ?`
      params.push(category)
    }
  }

  // 상위 카테고리만 (Protein용 - parent_id가 없는 것들만)
  if (topLevelOnly) {
    sql += ` AND i.parent_id IS NULL`
  }

  // 인기순 또는 이름순 정렬
  if (orderByPopularity) {
    sql += ` ORDER BY i.category, usage_count DESC, i.name`
  } else {
    sql += ` ORDER BY i.category, i.name`
  }

  const ingredients = db.prepare(sql).all(...params) as IngredientWithPopularity[]

  // 카테고리별로 그룹화
  const grouped = ingredients.reduce((acc, ing) => {
    const cat = ing.category || (locale === 'en' ? 'Other' : '기타')
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ing)
    return acc
  }, {} as Record<string, IngredientWithPopularity[]>)

  return {
    ingredients,
    grouped,
    categories: Object.keys(grouped)
  }
})
