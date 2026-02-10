// 입력값 검증 및 정제 함수
function sanitizeString(str: unknown, maxLength: number = 500): string | undefined {
  if (typeof str !== 'string') return undefined
  // HTML 태그 제거 및 길이 제한
  return str.trim().replace(/<[^>]*>/g, '').slice(0, maxLength) || undefined
}

function sanitizeNumber(num: unknown, min: number = 0, max: number = 10000): number | undefined {
  if (num === undefined || num === null || num === '') return undefined
  const parsed = Number(num)
  if (isNaN(parsed)) return undefined
  return Math.max(min, Math.min(max, parsed))
}

const VALID_CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '디저트', '음료', '기타']
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']
const VALID_STATUSES = ['draft', 'published']

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  const creator = getCreatorByUserId(user.id)
  if (!creator) {
    throw createError({
      statusCode: 403,
      message: '크리에이터로 등록해주세요'
    })
  }

  const body = await readBody(event)
  const {
    title,
    description,
    category,
    cookingTime,
    difficulty,
    youtubeVideoId,
    youtubeThumbnail,
    imageUrl,
    ingredients,
    steps,
    status
  } = body

  // 제목 검증 (필수, 1-100자)
  const sanitizedTitle = sanitizeString(title, 100)
  if (!sanitizedTitle || sanitizedTitle.length < 1) {
    throw createError({
      statusCode: 400,
      message: '요리 이름을 입력해주세요 (1-100자)'
    })
  }

  // 설명 검증 (선택, 최대 2000자)
  const sanitizedDescription = sanitizeString(description, 2000)

  // 카테고리 검증
  const sanitizedCategory = VALID_CATEGORIES.includes(category) ? category : undefined

  // 조리시간 검증 (1-600분)
  const sanitizedCookingTime = sanitizeNumber(cookingTime, 1, 600)

  // 난이도 검증
  const sanitizedDifficulty = VALID_DIFFICULTIES.includes(difficulty) ? difficulty : undefined

  // YouTube 비디오 ID 검증 (11자 영숫자)
  const sanitizedYoutubeVideoId = typeof youtubeVideoId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(youtubeVideoId)
    ? youtubeVideoId
    : undefined

  // YouTube 썸네일 URL 검증
  const sanitizedYoutubeThumbnail = typeof youtubeThumbnail === 'string' && youtubeThumbnail.startsWith('https://img.youtube.com/')
    ? youtubeThumbnail.slice(0, 200)
    : undefined

  // 이미지 URL 검증 (https만 허용)
  const sanitizedImageUrl = typeof imageUrl === 'string' && imageUrl.startsWith('https://')
    ? imageUrl.slice(0, 500)
    : undefined

  // 상태 검증
  const sanitizedStatus = VALID_STATUSES.includes(status) ? status : 'published'

  // 재료 검증
  const sanitizedIngredients = Array.isArray(ingredients)
    ? ingredients.slice(0, 50).map((ing: any) => ({
        ingredient_id: typeof ing.ingredient_id === 'number' ? ing.ingredient_id : undefined,
        custom_name: sanitizeString(ing.custom_name, 50),
        amount: sanitizeString(ing.amount, 50),
        is_main: ing.is_main === true
      })).filter((ing: any) => ing.ingredient_id || ing.custom_name)
    : []

  // 조리법 단계 검증
  const sanitizedSteps = Array.isArray(steps)
    ? steps.slice(0, 30).map((step: any) => ({
        description: sanitizeString(step.description, 1000) || '',
        image_url: typeof step.image_url === 'string' && step.image_url.startsWith('https://')
          ? step.image_url.slice(0, 500)
          : undefined
      })).filter((step: any) => step.description)
    : []

  // 레시피 생성 (검증된 값 사용)
  const recipeId = createUserRecipe(creator.id, {
    title: sanitizedTitle,
    description: sanitizedDescription,
    category: sanitizedCategory,
    cooking_time: sanitizedCookingTime,
    difficulty: sanitizedDifficulty,
    youtube_video_id: sanitizedYoutubeVideoId,
    youtube_thumbnail: sanitizedYoutubeThumbnail,
    image_url: sanitizedImageUrl,
    status: sanitizedStatus as 'draft' | 'published'
  })

  // 재료 추가 (검증된 값 사용)
  if (sanitizedIngredients.length > 0) {
    addRecipeIngredients(recipeId, sanitizedIngredients)
  }

  // 조리법 단계 추가 (검증된 값 사용)
  if (sanitizedSteps.length > 0) {
    addRecipeSteps(recipeId, sanitizedSteps)
  }

  return { id: recipeId, success: true }
})
