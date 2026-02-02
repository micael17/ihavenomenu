import { useDB, type Ingredient } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)
  const category = query.category as string | undefined

  let sql = `
    SELECT id, name, category
    FROM ingredients
    WHERE is_base = 1
  `
  const params: string[] = []

  if (category) {
    sql += ` AND category = ?`
    params.push(category)
  }

  sql += ` ORDER BY category, name`

  const ingredients = db.prepare(sql).all(...params) as Ingredient[]

  // 카테고리별로 그룹화
  const grouped = ingredients.reduce((acc, ing) => {
    const cat = ing.category || '기타'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ing)
    return acc
  }, {} as Record<string, Ingredient[]>)

  return {
    ingredients,
    grouped,
    categories: Object.keys(grouped)
  }
})
