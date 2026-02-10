export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      message: '잘못된 레시피 ID입니다'
    })
  }

  const recipe = getUserRecipeById(Number(id))

  if (!recipe) {
    throw createError({
      statusCode: 404,
      message: '레시피를 찾을 수 없습니다'
    })
  }

  // draft 레시피는 작성자만 접근 가능
  if (recipe.status === 'draft') {
    const user = getCurrentUser(event)
    const creator = user ? getCreatorByUserId(user.id) : null

    if (!creator || recipe.creator_id !== creator.id) {
      throw createError({
        statusCode: 404,
        message: '레시피를 찾을 수 없습니다'
      })
    }
  }

  // 조회수 증가 (published 레시피만)
  if (recipe.status === 'published') {
    incrementRecipeViewCount(Number(id))
  }

  return { recipe }
})
