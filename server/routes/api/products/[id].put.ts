// server/routes/api/products/[id].put.ts
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id   = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name:              body.name?.trim(),
        calories_per_100g: body.calories_per_100g != null ? Number(body.calories_per_100g) : undefined,
        protein_per_100g:  body.protein_per_100g  != null ? Number(body.protein_per_100g)  : undefined,
        fat_per_100g:      body.fat_per_100g       != null ? Number(body.fat_per_100g)       : undefined,
        carbs_per_100g:    body.carbs_per_100g     != null ? Number(body.carbs_per_100g)     : undefined,
        category:          body.category,
      },
    })
    return product
  } catch (e: any) {
    if (e.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'Продукт не найден' })
    if (e.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'Такое название уже занято' })
    throw e
  }
})
