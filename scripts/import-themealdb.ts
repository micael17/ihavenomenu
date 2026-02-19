/**
 * TheMealDB API에서 영어 레시피를 가져와 DB에 저장
 * https://www.themealdb.com/api.php (무료, API 키 불필요)
 */

import Database from '../web/node_modules/better-sqlite3'
import { resolve } from 'path'

const DB_PATH = resolve(__dirname, '../database/ihavenomenu.db')
const db = new Database(DB_PATH)

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1'

interface MealSummary {
  idMeal: string
  strMeal: string
  strMealThumb: string
}

interface MealDetail {
  idMeal: string
  strMeal: string
  strCategory: string
  strArea: string
  strInstructions: string
  strMealThumb: string
  strTags: string | null
  strYoutube: string | null
  strSource: string | null
  // Ingredients (1-20)
  strIngredient1: string | null
  strIngredient2: string | null
  strIngredient3: string | null
  strIngredient4: string | null
  strIngredient5: string | null
  strIngredient6: string | null
  strIngredient7: string | null
  strIngredient8: string | null
  strIngredient9: string | null
  strIngredient10: string | null
  strIngredient11: string | null
  strIngredient12: string | null
  strIngredient13: string | null
  strIngredient14: string | null
  strIngredient15: string | null
  strIngredient16: string | null
  strIngredient17: string | null
  strIngredient18: string | null
  strIngredient19: string | null
  strIngredient20: string | null
  // Measures (1-20)
  strMeasure1: string | null
  strMeasure2: string | null
  strMeasure3: string | null
  strMeasure4: string | null
  strMeasure5: string | null
  strMeasure6: string | null
  strMeasure7: string | null
  strMeasure8: string | null
  strMeasure9: string | null
  strMeasure10: string | null
  strMeasure11: string | null
  strMeasure12: string | null
  strMeasure13: string | null
  strMeasure14: string | null
  strMeasure15: string | null
  strMeasure16: string | null
  strMeasure17: string | null
  strMeasure18: string | null
  strMeasure19: string | null
  strMeasure20: string | null
}

// 카테고리 매핑 (TheMealDB -> 우리 DB)
const categoryMap: Record<string, string> = {
  'Beef': 'Main',
  'Chicken': 'Main',
  'Pork': 'Main',
  'Lamb': 'Main',
  'Goat': 'Main',
  'Seafood': 'Main',
  'Pasta': 'Main',
  'Starter': 'Appetizer',
  'Side': 'Side Dish',
  'Dessert': 'Dessert',
  'Breakfast': 'Breakfast',
  'Vegetarian': 'Main',
  'Vegan': 'Main',
  'Miscellaneous': 'Other'
}

// 재료 카테고리 추정
function guessIngredientCategory(name: string): string {
  const lowerName = name.toLowerCase()

  if (/chicken|beef|pork|lamb|bacon|sausage|ham|turkey|duck/i.test(lowerName)) {
    return 'Meat'
  }
  if (/fish|salmon|tuna|shrimp|prawn|crab|lobster|clam|mussel|oyster|squid|anchov/i.test(lowerName)) {
    return 'Seafood'
  }
  if (/milk|cream|cheese|butter|yogurt|egg/i.test(lowerName)) {
    return 'Dairy & Eggs'
  }
  if (/carrot|onion|garlic|tomato|potato|pepper|celery|lettuce|spinach|broccoli|cabbage|mushroom|zucchini|cucumber|bean|pea|corn|asparagus/i.test(lowerName)) {
    return 'Vegetables'
  }
  if (/apple|banana|orange|lemon|lime|berry|grape|mango|peach|pear|cherry|strawberry|raspberry|blueberry/i.test(lowerName)) {
    return 'Fruits'
  }
  if (/rice|pasta|noodle|bread|flour|oat|wheat|grain|couscous/i.test(lowerName)) {
    return 'Grains & Pasta'
  }
  if (/salt|pepper|sugar|oil|vinegar|sauce|ketchup|mustard|mayo|honey|syrup|spice|herb|basil|oregano|thyme|rosemary|cumin|paprika|cinnamon|nutmeg|ginger|turmeric|curry/i.test(lowerName)) {
    return 'Seasonings & Sauces'
  }
  if (/nut|almond|walnut|peanut|cashew|pistachio|seed|sesame/i.test(lowerName)) {
    return 'Nuts & Seeds'
  }
  if (/stock|broth|water|wine|beer|juice/i.test(lowerName)) {
    return 'Liquids'
  }

  return 'Other'
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`)
  }
  return response.json()
}

async function getAllCategories(): Promise<string[]> {
  const data = await fetchJson<{ categories: { strCategory: string }[] }>(
    `${BASE_URL}/categories.php`
  )
  return data.categories.map(c => c.strCategory)
}

async function getMealsByCategory(category: string): Promise<MealSummary[]> {
  const data = await fetchJson<{ meals: MealSummary[] | null }>(
    `${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`
  )
  return data.meals || []
}

async function getMealDetail(id: string): Promise<MealDetail | null> {
  const data = await fetchJson<{ meals: MealDetail[] | null }>(
    `${BASE_URL}/lookup.php?i=${id}`
  )
  return data.meals?.[0] || null
}

function extractIngredients(meal: MealDetail): { name: string; measure: string }[] {
  const ingredients: { name: string; measure: string }[] = []

  for (let i = 1; i <= 20; i++) {
    const name = (meal as any)[`strIngredient${i}`]?.trim()
    const measure = (meal as any)[`strMeasure${i}`]?.trim() || ''

    if (name && name.length > 0) {
      ingredients.push({ name, measure })
    }
  }

  return ingredients
}

function parseInstructions(instructions: string): string[] {
  // 줄바꿈 또는 번호로 구분된 단계들 파싱
  const steps = instructions
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.replace(/^\d+[\.\)]\s*/, '')) // "1. " 또는 "1) " 제거

  return steps
}

// DB에 재료 추가 (없으면 생성, 있으면 ID 반환)
function getOrCreateIngredient(name: string): number {
  const normalizedName = name.trim().toLowerCase()

  // 기존 재료 찾기
  const existing = db.prepare(
    'SELECT id FROM ingredients WHERE LOWER(name) = ?'
  ).get(normalizedName) as { id: number } | undefined

  if (existing) {
    return existing.id
  }

  // 새 재료 추가
  const category = guessIngredientCategory(name)
  // Meat, Seafood, Grains & Pasta, Seasonings & Sauces를 is_base로 설정
  const isBase = ['Meat', 'Seafood', 'Grains & Pasta', 'Seasonings & Sauces'].includes(category) ? 1 : 0
  const result = db.prepare(
    'INSERT INTO ingredients (name, category, is_base) VALUES (?, ?, ?)'
  ).run(name.trim(), category, isBase)

  return result.lastInsertRowid as number
}

// dish_ingredients 연결 추가
function linkDishIngredient(dishId: number, ingredientId: number, isMain: boolean = false): void {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id, is_main)
      VALUES (?, ?, ?)
    `).run(dishId, ingredientId, isMain ? 1 : 0)
  } catch (error) {
    // 중복은 무시
  }
}

// DB에 dish 추가
function getOrCreateDish(name: string, category: string, imageUrl: string, description: string): number {
  // 기존 dish 찾기
  const existing = db.prepare(
    'SELECT id FROM dishes WHERE LOWER(name) = ?'
  ).get(name.toLowerCase()) as { id: number } | undefined

  if (existing) {
    return existing.id
  }

  // 새 dish 추가
  const mappedCategory = categoryMap[category] || 'Other'
  const result = db.prepare(
    'INSERT INTO dishes (name, category, image_url, description) VALUES (?, ?, ?, ?)'
  ).run(name, mappedCategory, imageUrl, description.substring(0, 200))

  return result.lastInsertRowid as number
}

// DB에 recipe 추가
function insertRecipe(
  dishId: number,
  meal: MealDetail,
  ingredients: { name: string; measure: string }[]
): number {
  // 이미 존재하는지 확인 (source_id로)
  const existing = db.prepare(
    'SELECT id FROM recipes WHERE source = ? AND source_id = ?'
  ).get('TheMealDB', meal.idMeal) as { id: number } | undefined

  if (existing) {
    console.log(`  - Recipe already exists: ${meal.strMeal}`)
    return existing.id
  }

  const ingredientsRaw = ingredients
    .map(i => i.measure ? `${i.name} ${i.measure}` : i.name)
    .join(', ')

  const cookingSteps = JSON.stringify(parseInstructions(meal.strInstructions))

  const result = db.prepare(`
    INSERT INTO recipes (
      dish_id, title, source, source_id, description,
      ingredients_raw, cooking_steps, cooking_method,
      cooking_time, servings, difficulty, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dishId,
    meal.strMeal,
    'TheMealDB',
    meal.idMeal,
    meal.strTags || `${meal.strArea} ${meal.strCategory} dish`,
    ingredientsRaw,
    cookingSteps,
    meal.strCategory,
    null, // cooking_time - TheMealDB doesn't provide this
    '4', // default servings
    'Medium', // default difficulty
    meal.strMealThumb
  )

  return result.lastInsertRowid as number
}

async function importMeals() {
  console.log('Starting TheMealDB import...\n')

  // 카테고리 가져오기
  console.log('Fetching categories...')
  const categories = await getAllCategories()
  console.log(`Found ${categories.length} categories: ${categories.join(', ')}\n`)

  let totalMeals = 0
  let importedMeals = 0
  let totalIngredients = 0

  for (const category of categories) {
    console.log(`\n=== Processing category: ${category} ===`)

    // 카테고리별 레시피 목록
    const meals = await getMealsByCategory(category)
    console.log(`Found ${meals.length} meals`)
    totalMeals += meals.length

    for (const mealSummary of meals) {
      try {
        // 상세 정보 가져오기
        const meal = await getMealDetail(mealSummary.idMeal)
        if (!meal) {
          console.log(`  - Failed to fetch: ${mealSummary.strMeal}`)
          continue
        }

        // 재료 추출
        const ingredients = extractIngredients(meal)
        totalIngredients += ingredients.length

        // Dish 추가
        const dishId = getOrCreateDish(
          meal.strMeal,
          meal.strCategory,
          meal.strMealThumb,
          meal.strInstructions.substring(0, 200)
        )

        // 재료 DB에 추가 + dish_ingredients 연결
        for (let idx = 0; idx < ingredients.length; idx++) {
          const ing = ingredients[idx]
          const ingredientId = getOrCreateIngredient(ing.name)
          // 첫 3개 재료를 주재료로 설정
          linkDishIngredient(dishId, ingredientId, idx < 3)
        }

        // Recipe 추가
        insertRecipe(dishId, meal, ingredients)

        importedMeals++
        console.log(`  ✓ ${meal.strMeal} (${ingredients.length} ingredients)`)

        // Rate limiting - TheMealDB는 관대하지만 예의상
        await new Promise(r => setTimeout(r, 100))

      } catch (error) {
        console.error(`  ✗ Error processing ${mealSummary.strMeal}:`, error)
      }
    }
  }

  console.log('\n========================================')
  console.log(`Import complete!`)
  console.log(`Total meals found: ${totalMeals}`)
  console.log(`Successfully imported: ${importedMeals}`)
  console.log(`Total ingredients processed: ${totalIngredients}`)
  console.log('========================================')
}

// 실행
importMeals()
  .then(() => {
    db.close()
    process.exit(0)
  })
  .catch(error => {
    console.error('Import failed:', error)
    db.close()
    process.exit(1)
  })
