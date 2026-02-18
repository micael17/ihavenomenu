import Database from 'better-sqlite3'
import { resolve } from 'path'

let userDb: Database.Database | null = null

export function useUserDB(): Database.Database {
  if (userDb) return userDb

  const config = useRuntimeConfig()
  const dbPath = resolve(config.dbPath)

  console.log('[UserDB] Connecting to:', dbPath)

  userDb = new Database(dbPath, { readonly: false })
  userDb.pragma('journal_mode = WAL')

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
      password_hash TEXT,
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

  // 크리에이터 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      youtube_channel_url TEXT,
      channel_name TEXT,
      channel_thumbnail TEXT,
      recipe_count INTEGER DEFAULT 0,
      total_views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  // 사용자 레시피 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      cooking_time INTEGER,
      difficulty TEXT,
      youtube_video_id TEXT,
      youtube_thumbnail TEXT,
      image_url TEXT,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES creators(id)
    )
  `)

  // 사용자 레시피 재료 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      ingredient_id INTEGER,
      custom_name TEXT,
      amount TEXT,
      is_main INTEGER DEFAULT 0,
      FOREIGN KEY (recipe_id) REFERENCES user_recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    )
  `)

  // 조리법 단계 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_recipe_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      FOREIGN KEY (recipe_id) REFERENCES user_recipes(id) ON DELETE CASCADE
    )
  `)

  // password_hash 컬럼 마이그레이션 (기존 DB 대응)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`)
  } catch {
    // 이미 존재하면 무시
  }

  console.log('[UserDB] Tables initialized')
}

// 타입 정의
export interface User {
  id: number
  provider: 'google' | 'email'
  provider_id: string
  email: string | null
  password_hash: string | null
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

export interface Creator {
  id: number
  user_id: number
  youtube_channel_url: string | null
  channel_name: string | null
  channel_thumbnail: string | null
  recipe_count: number
  total_views: number
  created_at: string
}

export interface UserRecipe {
  id: number
  creator_id: number
  title: string
  description: string | null
  category: string | null
  cooking_time: number | null
  difficulty: string | null
  youtube_video_id: string | null
  youtube_thumbnail: string | null
  image_url: string | null
  view_count: number
  like_count: number
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface UserRecipeIngredient {
  id: number
  recipe_id: number
  ingredient_id: number | null
  custom_name: string | null
  amount: string | null
  is_main: number
}

export interface UserRecipeStep {
  id: number
  recipe_id: number
  step_number: number
  description: string
  image_url: string | null
}

// 사용자 프로필 업데이트
export function updateUserProfile(userId: number, data: { email?: string; nickname?: string; profileImage?: string }) {
  const db = useUserDB()
  const updates: string[] = []
  const values: any[] = []

  if (data.email !== undefined) {
    updates.push('email = ?')
    values.push(data.email)
  }
  if (data.nickname !== undefined) {
    updates.push('nickname = ?')
    values.push(data.nickname)
  }
  if (data.profileImage !== undefined) {
    updates.push('profile_image = ?')
    values.push(data.profileImage)
  }

  if (updates.length === 0) return

  values.push(userId)
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
}

// 사용자 조회/생성
export function findOrCreateUser(
  provider: 'google' | 'email',
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
      password_hash: null,
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

// 이메일로 유저 조회
export function findUserByEmail(email: string): User | undefined {
  const db = useUserDB()
  return db.prepare(
    'SELECT * FROM users WHERE provider = ? AND email = ?'
  ).get('email', email) as User | undefined
}

// 이메일 유저 생성
export function createEmailUser(
  email: string,
  passwordHash: string
): { user: User; isNew: boolean } {
  const db = useUserDB()

  const result = db.prepare(`
    INSERT INTO users (provider, provider_id, email, password_hash)
    VALUES (?, ?, ?, ?)
  `).run('email', email, email, passwordHash)

  return {
    user: {
      id: result.lastInsertRowid as number,
      provider: 'email',
      provider_id: email,
      email,
      password_hash: passwordHash,
      nickname: null,
      profile_image: null,
      onboarding_completed: 0,
      created_at: new Date().toISOString()
    },
    isNew: true
  }
}

// 온보딩 완료
export function completeOnboarding(
  userId: number,
  nickname: string,
  favoriteDishes: string[],
  dislikedIngredients: string[],
  myIngredients?: {
    protein?: number
    sauce?: number
    carb?: number
  }
) {
  const db = useUserDB()

  const run = db.transaction(() => {
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

      if (myIngredients.protein) {
        insertIngredient.run(userId, myIngredients.protein)
      }
      if (myIngredients.sauce) {
        insertIngredient.run(userId, myIngredients.sauce)
      }
      if (myIngredients.carb) {
        insertIngredient.run(userId, myIngredients.carb)
      }
    }
  })

  run()
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
export function getUserIngredients(userId: number, locale: 'en' | 'ko' = 'ko') {
  const db = useUserDB()
  const nameField = locale === 'en'
    ? `COALESCE(json_extract(i.aliases, '$[0]'), i.name) as name`
    : `i.name`
  const categoryField = locale === 'en'
    ? `COALESCE(i.category_en, i.category) as category`
    : `i.category`

  return db.prepare(`
    SELECT ui.*, ${nameField}, ${categoryField}
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
export function getExpiringIngredients(userId: number, locale: 'en' | 'ko' = 'ko') {
  const db = useUserDB()
  const nameField = locale === 'en'
    ? `COALESCE(json_extract(i.aliases, '$[0]'), i.name) as name`
    : `i.name`
  const categoryField = locale === 'en'
    ? `COALESCE(i.category_en, i.category) as category`
    : `i.category`

  return db.prepare(`
    SELECT ui.*, ${nameField}, ${categoryField},
      julianday(ui.expiry_date) - julianday('now') as days_left
    FROM user_ingredients ui
    JOIN ingredients i ON ui.ingredient_id = i.id
    WHERE ui.user_id = ?
      AND ui.expiry_date IS NOT NULL
      AND julianday(ui.expiry_date) - julianday('now') <= 3
    ORDER BY ui.expiry_date ASC
  `).all(userId)
}

// ==================== 크리에이터 관련 ====================

export function getCreatorByUserId(userId: number): Creator | undefined {
  const db = useUserDB()
  return db.prepare('SELECT * FROM creators WHERE user_id = ?').get(userId) as Creator | undefined
}

export function createCreator(
  userId: number,
  youtubeChannelUrl?: string,
  channelName?: string,
  channelThumbnail?: string
): Creator {
  const db = useUserDB()
  const result = db.prepare(`
    INSERT INTO creators (user_id, youtube_channel_url, channel_name, channel_thumbnail)
    VALUES (?, ?, ?, ?)
  `).run(userId, youtubeChannelUrl || null, channelName || null, channelThumbnail || null)

  return {
    id: result.lastInsertRowid as number,
    user_id: userId,
    youtube_channel_url: youtubeChannelUrl || null,
    channel_name: channelName || null,
    channel_thumbnail: channelThumbnail || null,
    recipe_count: 0,
    total_views: 0,
    created_at: new Date().toISOString()
  }
}

export function updateCreator(
  creatorId: number,
  data: { youtube_channel_url?: string; channel_name?: string; channel_thumbnail?: string }
) {
  const db = useUserDB()
  const updates: string[] = []
  const values: any[] = []

  if (data.youtube_channel_url !== undefined) {
    updates.push('youtube_channel_url = ?')
    values.push(data.youtube_channel_url)
  }
  if (data.channel_name !== undefined) {
    updates.push('channel_name = ?')
    values.push(data.channel_name)
  }
  if (data.channel_thumbnail !== undefined) {
    updates.push('channel_thumbnail = ?')
    values.push(data.channel_thumbnail)
  }

  if (updates.length === 0) return { updated: false }

  values.push(creatorId)
  db.prepare(`UPDATE creators SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return { updated: true }
}

// ==================== 사용자 레시피 관련 ====================

export function createUserRecipe(
  creatorId: number,
  data: {
    title: string
    description?: string
    category?: string
    cooking_time?: number
    difficulty?: string
    youtube_video_id?: string
    youtube_thumbnail?: string
    image_url?: string
    status?: 'draft' | 'published'
  }
): number {
  const db = useUserDB()
  const result = db.prepare(`
    INSERT INTO user_recipes (
      creator_id, title, description, category, cooking_time,
      difficulty, youtube_video_id, youtube_thumbnail, image_url, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    creatorId,
    data.title,
    data.description || null,
    data.category || null,
    data.cooking_time || null,
    data.difficulty || null,
    data.youtube_video_id || null,
    data.youtube_thumbnail || null,
    data.image_url || null,
    data.status || 'published'
  )

  // 크리에이터의 레시피 카운트 증가
  db.prepare('UPDATE creators SET recipe_count = recipe_count + 1 WHERE id = ?').run(creatorId)

  return result.lastInsertRowid as number
}

export function addRecipeIngredients(
  recipeId: number,
  ingredients: Array<{
    ingredient_id?: number
    custom_name?: string
    amount?: string
    is_main?: boolean
  }>
) {
  const db = useUserDB()
  const stmt = db.prepare(`
    INSERT INTO user_recipe_ingredients (recipe_id, ingredient_id, custom_name, amount, is_main)
    VALUES (?, ?, ?, ?, ?)
  `)

  for (const ing of ingredients) {
    stmt.run(
      recipeId,
      ing.ingredient_id || null,
      ing.custom_name || null,
      ing.amount || null,
      ing.is_main ? 1 : 0
    )
  }
}

export function addRecipeSteps(
  recipeId: number,
  steps: Array<{ description: string; image_url?: string }>
) {
  const db = useUserDB()
  const stmt = db.prepare(`
    INSERT INTO user_recipe_steps (recipe_id, step_number, description, image_url)
    VALUES (?, ?, ?, ?)
  `)

  steps.forEach((step, index) => {
    stmt.run(recipeId, index + 1, step.description, step.image_url || null)
  })
}

export function getUserRecipeById(recipeId: number) {
  const db = useUserDB()

  const recipe = db.prepare(`
    SELECT ur.*, c.channel_name, c.youtube_channel_url, u.nickname, u.profile_image
    FROM user_recipes ur
    JOIN creators c ON ur.creator_id = c.id
    JOIN users u ON c.user_id = u.id
    WHERE ur.id = ?
  `).get(recipeId) as any

  if (!recipe) return null

  const ingredients = db.prepare(`
    SELECT uri.*, i.name as ingredient_name, i.category as ingredient_category
    FROM user_recipe_ingredients uri
    LEFT JOIN ingredients i ON uri.ingredient_id = i.id
    WHERE uri.recipe_id = ?
  `).all(recipeId)

  const steps = db.prepare(`
    SELECT * FROM user_recipe_steps WHERE recipe_id = ? ORDER BY step_number
  `).all(recipeId)

  return { ...recipe, ingredients, steps }
}

export function getUserRecipesByCreator(creatorId: number, status?: string) {
  const db = useUserDB()
  let query = 'SELECT * FROM user_recipes WHERE creator_id = ?'
  const params: any[] = [creatorId]

  if (status) {
    query += ' AND status = ?'
    params.push(status)
  }

  query += ' ORDER BY created_at DESC'
  return db.prepare(query).all(...params)
}

export function searchUserRecipesByIngredients(ingredientIds: number[]) {
  if (ingredientIds.length === 0) return []

  const db = useUserDB()
  const placeholders = ingredientIds.map(() => '?').join(',')

  return db.prepare(`
    SELECT
      ur.*,
      c.channel_name,
      c.youtube_channel_url,
      u.nickname,
      u.profile_image,
      COUNT(DISTINCT uri.ingredient_id) as match_count,
      (SELECT COUNT(*) FROM user_recipe_ingredients WHERE recipe_id = ur.id) as total_ingredients
    FROM user_recipes ur
    JOIN creators c ON ur.creator_id = c.id
    JOIN users u ON c.user_id = u.id
    JOIN user_recipe_ingredients uri ON ur.id = uri.recipe_id
    WHERE ur.status = 'published'
      AND uri.ingredient_id IN (${placeholders})
    GROUP BY ur.id
    ORDER BY match_count DESC, ur.view_count DESC
  `).all(...ingredientIds)
}

export function incrementRecipeViewCount(recipeId: number) {
  const db = useUserDB()
  db.prepare('UPDATE user_recipes SET view_count = view_count + 1 WHERE id = ?').run(recipeId)
}

export function deleteUserRecipe(recipeId: number, creatorId: number) {
  const db = useUserDB()

  // 해당 크리에이터의 레시피인지 확인
  const recipe = db.prepare('SELECT creator_id FROM user_recipes WHERE id = ?').get(recipeId) as any
  if (!recipe || recipe.creator_id !== creatorId) {
    return { deleted: false, error: 'not_found_or_unauthorized' }
  }

  // 관련 데이터는 CASCADE로 자동 삭제
  db.prepare('DELETE FROM user_recipes WHERE id = ?').run(recipeId)
  db.prepare('UPDATE creators SET recipe_count = MAX(recipe_count - 1, 0) WHERE id = ?').run(creatorId)

  return { deleted: true }
}
