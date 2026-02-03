import Database from 'better-sqlite3'
import { resolve } from 'path'

let userDb: Database.Database | null = null

export function useUserDB(): Database.Database {
  if (userDb) return userDb

  const dbPath = resolve(process.cwd(), '../database/momokdi.db')

  console.log('[UserDB] Connecting to:', dbPath)

  // 사용자 데이터 저장을 위해 readonly: false
  userDb = new Database(dbPath, { readonly: false })

  // 사용자 테이블 초기화
  initUserTables(userDb)

  return userDb
}

function initUserTables(db: Database.Database) {
  // 사용자 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      email TEXT,
      nickname TEXT,
      profile_image TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(provider, provider_id)
    )
  `)

  // 사용자 재료 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      expiry_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id),
      UNIQUE(user_id, ingredient_id)
    )
  `)

  // 사용자 취향 테이블 (좋아하는 요리, 싫어하는 재료)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      preference_type TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, preference_type, value)
    )
  `)

  console.log('[UserDB] Tables initialized')
}

// 타입 정의
export interface User {
  id: number
  provider: 'kakao' | 'naver'
  provider_id: string
  email: string | null
  nickname: string | null
  profile_image: string | null
  onboarding_completed: number
  created_at: string
}

export interface UserIngredient {
  id: number
  user_id: number
  ingredient_id: number
  expiry_date: string | null
  created_at: string
}

// 사용자 조회/생성
export function findOrCreateUser(
  provider: 'kakao' | 'naver',
  providerId: string
): { user: User; isNew: boolean } {
  const db = useUserDB()

  // 기존 사용자 조회
  const existing = db.prepare(`
    SELECT * FROM users WHERE provider = ? AND provider_id = ?
  `).get(provider, providerId) as User | undefined

  if (existing) {
    return { user: existing, isNew: false }
  }

  // 새 사용자 생성 (닉네임 없이)
  const result = db.prepare(`
    INSERT INTO users (provider, provider_id)
    VALUES (?, ?)
  `).run(provider, providerId)

  return {
    user: {
      id: result.lastInsertRowid as number,
      provider,
      provider_id: providerId,
      email: null,
      nickname: null,
      profile_image: null,
      onboarding_completed: 0,
      created_at: new Date().toISOString()
    },
    isNew: true
  }
}

export function findUserById(id: number): User | undefined {
  const db = useUserDB()
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined
}

// 온보딩 완료
export function completeOnboarding(
  userId: number,
  nickname: string,
  favoriteDishes: string[],
  dislikedIngredients: string[],
  myIngredients?: {
    main?: number
    sauce?: number
    grain?: number
  }
) {
  const db = useUserDB()

  // 닉네임 업데이트 및 온보딩 완료
  db.prepare(`
    UPDATE users SET nickname = ?, onboarding_completed = 1 WHERE id = ?
  `).run(nickname, userId)

  // 기존 취향 데이터 삭제
  db.prepare(`DELETE FROM user_preferences WHERE user_id = ?`).run(userId)

  // 좋아하는 요리 저장
  const insertPref = db.prepare(`
    INSERT INTO user_preferences (user_id, preference_type, value)
    VALUES (?, ?, ?)
  `)

  for (const dish of favoriteDishes) {
    insertPref.run(userId, 'favorite_dish', dish)
  }

  // 싫어하는 재료 저장
  for (const ingredient of dislikedIngredients) {
    insertPref.run(userId, 'disliked_ingredient', ingredient)
  }

  // 내 재료 저장 (온보딩에서 선택한 재료)
  if (myIngredients) {
    const insertIngredient = db.prepare(`
      INSERT OR IGNORE INTO user_ingredients (user_id, ingredient_id)
      VALUES (?, ?)
    `)

    if (myIngredients.main) {
      insertIngredient.run(userId, myIngredients.main)
    }
    if (myIngredients.sauce) {
      insertIngredient.run(userId, myIngredients.sauce)
    }
    if (myIngredients.grain) {
      insertIngredient.run(userId, myIngredients.grain)
    }
  }

  return { success: true }
}

// 사용자 취향 조회
export function getUserPreferences(userId: number) {
  const db = useUserDB()
  const prefs = db.prepare(`
    SELECT preference_type, value FROM user_preferences WHERE user_id = ?
  `).all(userId) as { preference_type: string; value: string }[]

  const favoriteDishes: string[] = []
  const dislikedIngredients: string[] = []

  for (const pref of prefs) {
    if (pref.preference_type === 'favorite_dish') {
      favoriteDishes.push(pref.value)
    } else if (pref.preference_type === 'disliked_ingredient') {
      dislikedIngredients.push(pref.value)
    }
  }

  return { favoriteDishes, dislikedIngredients }
}

// 사용자 재료 관리
export function getUserIngredients(userId: number) {
  const db = useUserDB()
  return db.prepare(`
    SELECT ui.*, i.name, i.category
    FROM user_ingredients ui
    JOIN ingredients i ON ui.ingredient_id = i.id
    WHERE ui.user_id = ?
    ORDER BY
      CASE WHEN ui.expiry_date IS NOT NULL THEN 0 ELSE 1 END,
      ui.expiry_date ASC
  `).all(userId)
}

export function addUserIngredient(userId: number, ingredientId: number, expiryDate?: string) {
  const db = useUserDB()
  try {
    const result = db.prepare(`
      INSERT INTO user_ingredients (user_id, ingredient_id, expiry_date)
      VALUES (?, ?, ?)
    `).run(userId, ingredientId, expiryDate || null)
    return { id: result.lastInsertRowid }
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      // 이미 존재하면 업데이트
      db.prepare(`
        UPDATE user_ingredients SET expiry_date = ? WHERE user_id = ? AND ingredient_id = ?
      `).run(expiryDate || null, userId, ingredientId)
      return { updated: true }
    }
    throw error
  }
}

export function removeUserIngredient(userId: number, ingredientId: number) {
  const db = useUserDB()
  const result = db.prepare(`
    DELETE FROM user_ingredients WHERE user_id = ? AND ingredient_id = ?
  `).run(userId, ingredientId)
  return { deleted: result.changes > 0 }
}

export function updateUserIngredientExpiry(userId: number, ingredientId: number, expiryDate: string | null) {
  const db = useUserDB()
  const result = db.prepare(`
    UPDATE user_ingredients SET expiry_date = ? WHERE user_id = ? AND ingredient_id = ?
  `).run(expiryDate, userId, ingredientId)
  return { updated: result.changes > 0 }
}

// 유통기한 임박 재료 조회 (D-3 이하)
export function getExpiringIngredients(userId: number) {
  const db = useUserDB()
  return db.prepare(`
    SELECT ui.*, i.name, i.category,
      julianday(ui.expiry_date) - julianday('now') as days_left
    FROM user_ingredients ui
    JOIN ingredients i ON ui.ingredient_id = i.id
    WHERE ui.user_id = ?
      AND ui.expiry_date IS NOT NULL
      AND julianday(ui.expiry_date) - julianday('now') <= 3
    ORDER BY ui.expiry_date ASC
  `).all(userId)
}
