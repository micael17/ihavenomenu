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
  // category_en을 통합 그룹핑 키로 항상 가져옴
  const categoryField = locale === 'en'
    ? `COALESCE(i.category_en, i.category) as category`
    : `i.category`

  let sql = `
    SELECT i.id, ${nameField}, ${categoryField}, COALESCE(i.category_en, i.category) as category_key, COALESCE(di_count.usage_count, 0) as usage_count
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

  const ingredients = db.prepare(sql).all(...params) as (IngredientWithPopularity & { category_key: string })[]

  // 한글 locale용 카테고리 매핑 (영어 키 → 한글 표시명)
  const categoryKoMap: Record<string, string> = {
    'Vegetables': '채소류',
    'Meat': '육류',
    'Seafood': '해물류',
    'Dairy & Eggs': '달걀/유제품',
    'Seasonings & Sauces': '양념류',
    'Grains': '곡류',
    'Grains & Pasta': '곡류/면류',
    'Kimchi': '김치류',
    'Beans & Nuts': '콩/견과류',
    'Nuts & Seeds': '견과류',
    'Fruits': '과일류',
    'Liquids': '액체류',
  }

  // category_en(category_key)을 기준으로 통합 그룹핑
  const grouped: Record<string, IngredientWithPopularity[]> = {}
  for (const ing of ingredients) {
    const groupKey = ing.category_key || (locale === 'en' ? 'Other' : '기타')
    const displayKey = locale === 'en' ? groupKey : (categoryKoMap[groupKey] || groupKey)
    if (!grouped[displayKey]) grouped[displayKey] = []
    grouped[displayKey].push(ing)
  }

  return {
    ingredients,
    grouped,
    categories: Object.keys(grouped)
  }
})
