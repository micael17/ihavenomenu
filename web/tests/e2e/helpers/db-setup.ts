import { copyFileSync, existsSync, unlinkSync } from 'fs'
import { resolve } from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const ROOT = resolve(__dirname, '..', '..', '..')
const SRC_DB = resolve(ROOT, '..', 'database', 'ihavenomenu.db')
const TEST_DB = resolve(ROOT, '..', 'database', 'ihavenomenu.test.db')

export default function globalSetup() {
  if (!existsSync(SRC_DB)) {
    throw new Error(`Source DB not found: ${SRC_DB}`)
  }

  // 원본 DB → 테스트 DB 복사
  copyFileSync(SRC_DB, TEST_DB)

  // WAL/SHM 파일 정리 (새 DB는 깨끗하게 시작)
  try { unlinkSync(TEST_DB + '-wal') } catch {}
  try { unlinkSync(TEST_DB + '-shm') } catch {}

  // 유저 관련 테이블 초기화
  const Database = require('better-sqlite3')
  const db = new Database(TEST_DB)
  db.pragma('journal_mode = WAL')

  db.exec('DELETE FROM user_recipe_steps')
  db.exec('DELETE FROM user_recipe_ingredients')
  db.exec('DELETE FROM user_recipes')
  db.exec('DELETE FROM creators')
  db.exec('DELETE FROM user_preferences')
  db.exec('DELETE FROM user_ingredients')
  db.exec('DELETE FROM users')

  db.close()
  console.log('[E2E Setup] Test DB ready:', TEST_DB)
}
