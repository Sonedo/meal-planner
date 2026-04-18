// server/routes/api/products/index.post.ts
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name || body.calories_per_100g == null) {
    throw createError({ statusCode: 400, statusMessage: 'Обязательны поля: name и calories_per_100g' })
  }

  try {
    const product = await prisma.product.create({
      data: {
        name:             body.name.trim(),
        calories_per_100g: Number(body.calories_per_100g),
        protein_per_100g:  Number(body.protein_per_100g ?? 0),
        fat_per_100g:      Number(body.fat_per_100g ?? 0),
        carbs_per_100g:    Number(body.carbs_per_100g ?? 0),
        category:          body.category ?? 'other',
      },
    })
    return product
  } catch (e: any) {
    if (e.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Продукт с таким названием уже существует' })
    }
    throw e
  }
})
