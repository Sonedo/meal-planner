import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body    = await readBody(event)

  if (!body.date || !body.meal_type || !body.dish_id)
    throw createError({ statusCode: 400, statusMessage: 'Обязательны поля: date, meal_type и dish_id' })
  if (!VALID_MEAL_TYPES.includes(body.meal_type))
    throw createError({ statusCode: 400, statusMessage: 'Неверный meal_type' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date))
    throw createError({ statusCode: 400, statusMessage: 'Дата должна быть в формате ГГГГ-ММ-ДД' })

  const portions = body.portions ? Number(body.portions) : 1
  if (portions <= 0 || portions > 100)
    throw createError({ statusCode: 400, statusMessage: 'portions должно быть от 0.1 до 100' })

  let targetUserId = session.userId
  if (body.target_user_id && Number(body.target_user_id) !== session.userId) {
    if (!session.familyId) throw createError({ statusCode: 403, statusMessage: 'Вы не состоите в семье' })
    const target = await prisma.user.findUnique({ where: { id: Number(body.target_user_id) }, select: { id: true, family_id: true } })
    if (!target || target.family_id !== session.familyId)
      throw createError({ statusCode: 403, statusMessage: 'Пользователь не в вашей семье' })
    targetUserId = target.id
  }

  // Доп. ингредиенты (добавленные)
  const extras: Array<{ product_id: number; quantity_grams: number }> =
    Array.isArray(body.extra_ingredients)
      ? body.extra_ingredients
          .map((e: any) => ({ product_id: Number(e.product_id), quantity_grams: Number(e.quantity_grams) }))
          .filter((e: any) => e.product_id && e.quantity_grams > 0)
      : []

  // Исключённые ингредиенты (убранные из рецепта)
  const excluded: Array<{ product_id: number }> =
    Array.isArray(body.excluded_ingredients)
      ? body.excluded_ingredients
          .map((e: any) => ({ product_id: Number(e) }))
          .filter((e: any) => e.product_id > 0)
      : []

  const entry = await prisma.mealPlanEntry.create({
    data: {
      user_id:   targetUserId,
      date:      body.date,
      meal_type: body.meal_type,
      dish_id:   Number(body.dish_id),
      portions,
      note:      body.note?.trim() || null,
      extraIngredients:    extras.length   > 0 ? { create: extras }   : undefined,
      excludedIngredients: excluded.length > 0 ? { create: excluded } : undefined,
    },
    include: {
      user:               { select: { id: true, display_name: true } },
      dish:               { include: { ingredients: { include: { product: true } } } },
      extraIngredients:   { include: { product: true } },
      excludedIngredients: { include: { product: true } },
    },
  })

  return entry
})
