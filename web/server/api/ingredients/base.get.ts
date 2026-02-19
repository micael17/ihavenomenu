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

  // locale에 따라 적절한 name, category 필드 선택
  const nameField = locale === 'ko'
    ? 'COALESCE(i.name_ko, i.name) as display_name'
    : 'COALESCE(i.name_en, i.name) as display_name'
  const categoryField = locale === 'ko'
    ? 'COALESCE(i.category_ko, i.category) as display_category'
    : 'COALESCE(i.category_en, i.category) as display_category'

  let sql = `
    SELECT i.id, i.name, i.name_ko, i.name_en,
      ${nameField},
      ${categoryField},
      COALESCE(i.category_en, i.category) as category_key,
      COALESCE(di_count.usage_count, 0) as usage_count
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
    sql += ` AND (i.category_en = ? OR i.category = ? OR i.category_ko = ?)`
    params.push(category, category, category)
  }

  if (topLevelOnly) {
    sql += ` AND i.parent_id IS NULL`
  }

  // name_ko 또는 name_en이 있는 재료만 표시 (locale에 따라)
  if (locale === 'ko') {
    sql += ` AND i.name_ko IS NOT NULL AND i.name_ko != ''`
  } else {
    sql += ` AND i.name_en IS NOT NULL AND i.name_en != ''`
  }

  if (orderByPopularity) {
    sql += ` ORDER BY display_category, usage_count DESC, display_name`
  } else {
    sql += ` ORDER BY display_category, display_name`
  }

  interface RawResult {
    id: number
    name: string
    name_ko: string | null
    name_en: string | null
    display_name: string
    display_category: string
    category_key: string
    usage_count: number
  }

  const rawIngredients = db.prepare(sql).all(...params) as RawResult[]

  // 중복 제거: 같은 재료가 한글/영문 모두 있을 수 있으므로 ID 기준으로 필터링
  const seenIds = new Set<number>()
  const ingredients: IngredientWithPopularity[] = []
  const grouped: Record<string, IngredientWithPopularity[]> = {}

  for (const ing of rawIngredients) {
    if (seenIds.has(ing.id)) continue
    seenIds.add(ing.id)

    const result: IngredientWithPopularity = {
      id: ing.id,
      name: ing.display_name,
      category: ing.display_category,
      usage_count: ing.usage_count,
    } as IngredientWithPopularity

    ingredients.push(result)

    const catDisplay = result.category || (locale === 'en' ? 'Other' : '기타')
    if (!grouped[catDisplay]) grouped[catDisplay] = []
    grouped[catDisplay].push(result)
  }

  return {
    ingredients,
    grouped,
    categories: Object.keys(grouped)
  }
})
