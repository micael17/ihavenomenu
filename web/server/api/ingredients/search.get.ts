import { useDB, type Ingredient } from '../../utils/db'

interface SearchResult extends Ingredient {
  match_type: 'exact' | 'prefix' | 'alias' | 'contains'
}

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const q = (query.q as string || '').trim()
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
    categoryFilter = ` AND category IN (${placeholders})`
    categoryParams.push(...categories)
  }

  // 검색어
  const searchTerm = q
  const prefixPattern = `${searchTerm}%`
  const containsPattern = `%${searchTerm}%`

  // 검색 쿼리 - 우선순위에 따라 정렬
  const sql = `
    SELECT
      id, name, category, is_base,
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
