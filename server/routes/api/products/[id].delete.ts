// server/routes/api/products/[id].delete.ts
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  // Check if product is used in any dish
  const usageCount = await prisma.dishIngredient.count({ where: { product_id: id } })
  if (usageCount > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Невозможно удалить: продукт используется в ${usageCount} блюде(ах). Сначала удалите его из всех блюд.`,
    })
  }

  try {
    await prisma.product.delete({ where: { id } })
    return { success: true }
  } catch (e: any) {
    if (e.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'Продукт не найден' })
    throw e
  }
})
