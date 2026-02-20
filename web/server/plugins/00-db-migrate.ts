import Database from 'better-sqlite3'
import { resolve } from 'path'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const dbPath = resolve(config.dbPath)

  console.log('[Migration] DB 스키마 점검 시작:', dbPath)

  let db: Database.Database | null = null
  try {
    db = new Database(dbPath, { readonly: false })
    db.pragma('busy_timeout = 5000')

    // 현재 컬럼 목록 확인
    const ingredientCols = db.prepare("PRAGMA table_info(ingredients)").all() as { name: string }[]
    const dishCols = db.prepare("PRAGMA table_info(dishes)").all() as { name: string }[]

    const ingredientColNames = new Set(ingredientCols.map(c => c.name))
    const dishColNames = new Set(dishCols.map(c => c.name))

    let migrated = false

    // ingredients 테이블 i18n 컬럼 추가
    const ingredientMigrations = [
      { col: 'name_ko', sql: 'ALTER TABLE ingredients ADD COLUMN name_ko TEXT' },
      { col: 'name_en', sql: 'ALTER TABLE ingredients ADD COLUMN name_en TEXT' },
      { col: 'category_ko', sql: 'ALTER TABLE ingredients ADD COLUMN category_ko TEXT' },
      { col: 'category_en', sql: 'ALTER TABLE ingredients ADD COLUMN category_en TEXT' },
      { col: 'parent_id', sql: 'ALTER TABLE ingredients ADD COLUMN parent_id INTEGER' },
      { col: 'is_base', sql: 'ALTER TABLE ingredients ADD COLUMN is_base BOOLEAN DEFAULT 0' },
    ]

    for (const m of ingredientMigrations) {
      if (!ingredientColNames.has(m.col)) {
        db.exec(m.sql)
        console.log(`[Migration] ingredients.${m.col} 컬럼 추가`)
        migrated = true
      }
    }

    // dishes 테이블 name_en 컬럼 추가
    if (!dishColNames.has('name_en')) {
      db.exec('ALTER TABLE dishes ADD COLUMN name_en TEXT')
      console.log('[Migration] dishes.name_en 컬럼 추가')
      migrated = true
    }

    // 인덱스 추가
    db.exec('CREATE INDEX IF NOT EXISTS idx_ingredients_name_ko ON ingredients(name_ko)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_ingredients_name_en ON ingredients(name_en)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_ingredients_parent ON ingredients(parent_id)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_ingredients_base ON ingredients(is_base)')
    db.exec('CREATE INDEX IF NOT EXISTS idx_dishes_name_en ON dishes(name_en)')

    if (migrated) {
      console.log('[Migration] 스키마 마이그레이션 완료')
    } else {
      console.log('[Migration] 스키마 최신 상태')
    }

    // i18n 데이터 존재 여부 확인
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN name_ko IS NOT NULL AND name_ko != '' THEN 1 END) as has_ko,
        COUNT(CASE WHEN name_en IS NOT NULL AND name_en != '' THEN 1 END) as has_en
      FROM ingredients WHERE is_base = 1
    `).get() as { total: number; has_ko: number; has_en: number }

    console.log(`[Migration] 재료 통계: 전체=${stats.total}, name_ko=${stats.has_ko}, name_en=${stats.has_en}`)

    if (stats.total > 0 && (stats.has_ko === 0 || stats.has_en === 0)) {
      console.warn('[Migration] ⚠️ i18n 데이터가 비어있습니다. 마이그레이션 스크립트를 실행해주세요.')
    }

  } catch (err) {
    console.error('[Migration] 스키마 점검 실패:', err)
  } finally {
    if (db) {
      try { db.close() } catch { /* ignore */ }
    }
  }
})
