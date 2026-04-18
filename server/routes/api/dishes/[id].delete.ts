// server/routes/api/dishes/[id].delete.ts
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  const planUsage = await prisma.mealPlanEntry.count({ where: { dish_id: id } })
  if (planUsage > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Невозможно удалить: блюдо используется в ${planUsage} записях плана питания. Сначала удалите его из плана.`,
    })
  }

  try {
    await prisma.dish.delete({ where: { id } })
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'Блюдо не найдено' })
    throw e
  }
})
