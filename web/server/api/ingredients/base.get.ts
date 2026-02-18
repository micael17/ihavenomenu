import { useDB, type Ingredient } from '../../utils/db'
import { getLocale } from '../../utils/locale'

interface IngredientWithPopularity extends Ingredient {
  usage_count: number
}

interface RawIngredient extends IngredientWithPopularity {
  category_key: string
  aliases: string | null
  raw_category: string
}

// 한글 카테고리인지 판별 (category와 category_en이 다르면 한글 원본)
function isKoreanOrigin(ing: RawIngredient): boolean {
  return ing.raw_category !== ing.category_key
}

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

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)
  const category = query.category as string | undefined
  const topLevelOnly = query.topLevelOnly === 'true'
  const orderByPopularity = query.orderByPopularity === 'true'
  const locale = getLocale(event)

  let sql = `
    SELECT i.id, i.name, i.category as raw_category,
      COALESCE(i.category_en, i.category) as category_key,
      i.aliases,
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
    sql += ` AND (i.category_en = ? OR i.category = ?)`
    params.push(category, category)
  }

  if (topLevelOnly) {
    sql += ` AND i.parent_id IS NULL`
  }

  if (orderByPopularity) {
    sql += ` ORDER BY i.category, usage_count DESC, i.name`
  } else {
    sql += ` ORDER BY i.category, i.name`
  }

  const rawIngredients = db.prepare(sql).all(...params) as RawIngredient[]

  // 한글 재료의 aliases를 모아서 중복 판별용 세트 생성
  const koAliasSet = new Set<string>()
  const enNameSetFromKo = new Set<string>()
  for (const ing of rawIngredients) {
    if (isKoreanOrigin(ing) && ing.aliases) {
      try {
        const aliases: string[] = JSON.parse(ing.aliases)
        aliases.forEach(a => koAliasSet.add(a.toLowerCase()))
      } catch {}
    }
    if (!isKoreanOrigin(ing)) {
      enNameSetFromKo.add(ing.name.toLowerCase())
    }
  }

  // 중복 제거 + locale에 맞는 이름 결정
  const ingredients: IngredientWithPopularity[] = []
  const grouped: Record<string, IngredientWithPopularity[]> = {}

  for (const ing of rawIngredients) {
    const isKo = isKoreanOrigin(ing)
    let displayName: string
    let skip = false

    if (locale === 'ko') {
      if (isKo) {
        // 한글 재료: 그대로 사용
        displayName = ing.name
      } else {
        // 영어 재료: 한글 대응이 있으면 스킵 (중복 방지)
        if (koAliasSet.has(ing.name.toLowerCase())) {
          skip = true
        }
        // 한글 대응 없으면 영어 이름 그대로
        displayName = ing.name
      }
    } else {
      if (!isKo) {
        // 영어 재료: 그대로 사용
        displayName = ing.name
      } else {
        // 한글 재료: 영어 대응이 있으면 스킵
        if (ing.aliases) {
          try {
            const aliases: string[] = JSON.parse(ing.aliases)
            if (aliases.some(a => enNameSetFromKo.has(a.toLowerCase()))) {
              skip = true
            }
          } catch {}
        }
        // 영어 대응 없으면 aliases[0] 사용, 없으면 원본
        if (ing.aliases) {
          try {
            const aliases: string[] = JSON.parse(ing.aliases)
            displayName = aliases[0] || ing.name
          } catch {
            displayName = ing.name
          }
        } else {
          displayName = ing.name
        }
      }
    }

    if (skip) continue

    const result: IngredientWithPopularity = {
      id: ing.id,
      name: displayName!,
      category: locale === 'en'
        ? ing.category_key
        : (categoryKoMap[ing.category_key] || ing.category_key),
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
