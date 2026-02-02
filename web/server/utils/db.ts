import Database from 'better-sqlite3'
import { resolve } from 'path'

let db: Database.Database | null = null

export function useDB(): Database.Database {
  if (db) return db

  // 절대 경로로 DB 파일 지정 (프로젝트 루트의 database 폴더)
  const dbPath = resolve(process.cwd(), '../database/momokdi.db')

  console.log('[DB] Connecting to:', dbPath)

  db = new Database(dbPath, { readonly: true })

  return db
}

// 타입 정의
export interface Ingredient {
  id: number
  name: string
  category: string | null
  parent_id: number | null
  is_base: boolean
}

export interface Dish {
  id: number
  name: string
  category: string | null
  image_url: string | null
  description: string | null
}

export interface DishWithIngredients extends Dish {
  ingredients: string
  match_count: number
  total_count: number
}

export interface Recipe {
  id: number
  dish_id: number
  title: string
  source: string | null
  description: string | null
  ingredients_raw: string | null
  cooking_steps: string | null
  cooking_method: string | null
  cooking_time: string | null
  servings: string | null
  difficulty: string | null
  image_url: string | null
}
