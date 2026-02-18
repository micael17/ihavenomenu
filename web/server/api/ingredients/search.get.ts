import { useDB, type Ingredient } from '../../utils/db'
import { getLocale } from '../../utils/locale'

interface SearchResult extends Ingredient {
  match_type: 'exact' | 'prefix' | 'alias' | 'contains'
}

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { maxRequests: 30, windowMs: 60000 })

  const db = useDB()
  const query = getQuery(event)
  const locale = getLocale(event)

  const q = (query.q as string || '').trim()
  const sanitized = q.replace(/[%_]/g, '\\$&')
  const categoriesParam = query.categories as string | undefined

  if (!q) {
    return { results: [] }
  }

  // 카테고리 필터링
  let categoryFilter = ''
  const categoryParams: string[] = []

  if (categoriesParam) {
    const categories = categoriesParam.split(',').map(c => c.trim())
    const placeholders = categories.map(() => '?').join(', ')
    if (locale === 'en') {
      categoryFilter = ` AND (category_en IN (${placeholders}) OR category IN (${placeholders}))`
      categoryParams.push(...categories, ...categories)
    } else {
      categoryFilter = ` AND category IN (${placeholders})`
      categoryParams.push(...categories)
    }
  }

  // 검색어 (LIKE 와일드카드 이스케이프)
  const searchTerm = q
  const prefixPattern = `${sanitized}%`
  const containsPattern = `%${sanitized}%`

  const nameField = locale === 'en'
    ? `COALESCE(json_extract(aliases, '$[0]'), name) as name`
    : `name`
  const categoryField = locale === 'en'
    ? `COALESCE(category_en, category) as category`
    : `category`

  // 검색 쿼리 - 우선순위에 따라 정렬
  const sql = `
    SELECT
      id, ${nameField}, ${categoryField}, is_base,
      CASE
        WHEN name = ? THEN 'exact'
        WHEN name LIKE ? THEN 'prefix'
        WHEN aliases LIKE ? THEN 'alias'
        ELSE 'contains'
      END as match_type
    FROM ingredients
    WHERE is_base = 1
      ${categoryFilter}
      AND (
        name = ?
        OR name LIKE ?
        OR aliases LIKE ?
        OR name LIKE ?
      )
    ORDER BY
      CASE
        WHEN name = ? THEN 1
        WHEN name LIKE ? THEN 2
        WHEN aliases LIKE ? THEN 3
        ELSE 4
      END,
      length(name),
      name
    LIMIT 10
  `

  // 파라미터 순서:
  // CASE (3개): exact, prefix, alias
  // 카테고리 필터 (가변)
  // WHERE (4개): exact, prefix, alias, contains
  // ORDER BY CASE (3개): exact, prefix, alias
  const allParams = [
    searchTerm, prefixPattern, containsPattern, // CASE
    ...categoryParams, // 카테고리 필터
    searchTerm, prefixPattern, containsPattern, containsPattern, // WHERE
    searchTerm, prefixPattern, containsPattern // ORDER BY
  ]

  const results = db.prepare(sql).all(...allParams) as SearchResult[]

  return {
    results,
    query: q
  }
})
