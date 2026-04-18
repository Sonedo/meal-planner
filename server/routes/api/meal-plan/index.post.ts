// server/routes/api/meal-plan/index.post.ts
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body    = await readBody(event)

  if (!body.date || !body.meal_type || !body.dish_id)
    throw createError({ statusCode: 400, statusMessage: 'Обязательны поля: date, meal_type и dish_id' })
  if (!VALID_MEAL_TYPES.includes(body.meal_type))
    throw createError({ statusCode: 400, statusMessage: `meal_type должен быть одним из: ${VALID_MEAL_TYPES.join(', ')}` })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date))
    throw createError({ statusCode: 400, statusMessage: 'Дата должна быть в формате ГГГГ-ММ-ДД' })

  const portions = body.portions ? Number(body.portions) : 1
  if (portions <= 0 || portions > 100)
    throw createError({ statusCode: 400, statusMessage: 'portions должно быть от 0.1 до 100' })

  // Определяем target_user_id — для кого добавляем запись
  let targetUserId = session.userId

  if (body.target_user_id && Number(body.target_user_id) !== session.userId) {
    // Добавляем за другого члена семьи — проверяем, что они в одной семье
    if (!session.familyId)
      throw createError({ statusCode: 403, statusMessage: 'Вы не состоите в семье' })

    const targetUser = await prisma.user.findUnique({
      where: { id: Number(body.target_user_id) },
      select: { id: true, family_id: true },
    })
    if (!targetUser || targetUser.family_id !== session.familyId)
      throw createError({ statusCode: 403, statusMessage: 'Этот пользователь не в вашей семье' })

    targetUserId = targetUser.id
  }

  const entry = await prisma.mealPlanEntry.create({
    data: {
      user_id:   targetUserId,
      date:      body.date,
      meal_type: body.meal_type,
      dish_id:   Number(body.dish_id),
      portions,
    },
    include: {
      user: { select: { id: true, display_name: true } },
      dish: { include: { ingredients: { include: { product: true } } } },
    },
  })

  return entry
})
