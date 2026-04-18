// server/routes/api/meal-plan/[id].delete.ts
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id      = Number(getRouterParam(event, 'id'))

  const entry = await prisma.mealPlanEntry.findUnique({ where: { id } })
  if (!entry) throw createError({ statusCode: 404, statusMessage: 'Запись не найдена' })
  if (entry.user_id !== session.userId)
    throw createError({ statusCode: 403, statusMessage: 'Нельзя удалить чужую запись' })

  await prisma.mealPlanEntry.delete({ where: { id } })
  return { success: true }
})
