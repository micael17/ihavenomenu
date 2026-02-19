import { defineEventHandler } from 'h3'
import { useDB } from '../../utils/db'

export default defineEventHandler(async () => {
  const db = useDB()

  // 정적 페이지들
  const staticUrls = [
    { loc: '/', changefreq: 'daily', priority: 1.0 },
    { loc: '/my-fridge', changefreq: 'weekly', priority: 0.8 },
    { loc: '/login', changefreq: 'monthly', priority: 0.3 }
  ]

  // 공개된 레시피 (크리에이터 레시피)
  const recipes = db.prepare(`
    SELECT id, updated_at
    FROM user_recipes
    WHERE status = 'published'
    ORDER BY updated_at DESC
    LIMIT 1000
  `).all() as Array<{ id: number; updated_at: string }>

  const recipeUrls = recipes.map((recipe) => ({
    loc: `/recipe/${recipe.id}`,
    lastmod: recipe.updated_at,
    changefreq: 'weekly',
    priority: 0.7
  }))

  // 요리 상세 페이지 (DB의 dish 기반)
  const dishes = db.prepare(`
    SELECT id
    FROM dishes
    WHERE id IN (
      SELECT DISTINCT dish_id FROM recipes
    )
    ORDER BY id
    LIMIT 1000
  `).all() as Array<{ id: number }>

  const dishUrls = dishes.map((dish) => ({
    loc: `/${dish.id}`,
    changefreq: 'monthly',
    priority: 0.6
  }))

  return [...staticUrls, ...recipeUrls, ...dishUrls]
})
