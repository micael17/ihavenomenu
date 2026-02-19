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

  // 검색어
  const searchTerm = q
  const prefixPattern = `${sanitized}%`
  const containsPattern = `%${sanitized}%`

  // locale에 따라 적절한 필드 선택
  const nameField = locale === 'ko'
    ? 'COALESCE(name_ko, name) as name'
    : 'COALESCE(name_en, name) as name'
  const categoryField = locale === 'ko'
    ? 'COALESCE(category_ko, category) as category'
    : 'COALESCE(category_en, category) as category'

  // 검색 필드: name_ko, name_en, 또는 aliases 모두 검색
  const sql = `
    SELECT
      id, ${nameField}, ${categoryField}, is_base,
      CASE
        WHEN name_ko = ? OR name_en = ? THEN 'exact'
        WHEN name_ko LIKE ? OR name_en LIKE ? THEN 'prefix'
        WHEN aliases LIKE ? THEN 'alias'
        ELSE 'contains'
      END as match_type
    FROM ingredients
    WHERE is_base = 1
      ${categoryFilter}
      AND (
        name_ko = ?
        OR name_en = ?
        OR name_ko LIKE ?
        OR name_en LIKE ?
        OR aliases LIKE ?
        OR name_ko LIKE ?
        OR name_en LIKE ?
      )
    ORDER BY
      CASE
        WHEN name_ko = ? OR name_en = ? THEN 1
        WHEN name_ko LIKE ? OR name_en LIKE ? THEN 2
        WHEN aliases LIKE ? THEN 3
        ELSE 4
      END,
      CASE WHEN name_ko IS NOT NULL THEN length(name_ko) ELSE length(name_en) END,
      COALESCE(name_ko, name_en)
    LIMIT 10
  `

  // 파라미터 순서:
  // CASE (5개): exact(2), prefix(2), alias(1)
  // 카테고리 필터 (가변)
  // WHERE (7개): exact(2), prefix(2), alias(1), contains(2)
  // ORDER BY CASE (5개): exact(2), prefix(2), alias(1)
  const allParams = [
    // CASE
    searchTerm, searchTerm, prefixPattern, prefixPattern, containsPattern,
    // 카테고리 필터
    ...categoryParams,
    // WHERE
    searchTerm, searchTerm, prefixPattern, prefixPattern, containsPattern, containsPattern, containsPattern,
    // ORDER BY
    searchTerm, searchTerm, prefixPattern, prefixPattern, containsPattern
  ]

  const results = db.prepare(sql).all(...allParams) as SearchResult[]

  return {
    results,
    query: q
  }
})
