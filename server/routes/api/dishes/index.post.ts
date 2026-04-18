// server/routes/api/dishes/index.post.ts
import { prisma } from '~/server/utils/prisma'
import { calculateDishNutrition } from '~/server/utils/nutrition'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name) throw createError({ statusCode: 400, statusMessage: 'Поле name обязательно' })
  if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Нужен хотя бы один ингредиент' })
  }

  const productIds = body.ingredients.map((i: any) => Number(i.product_id))
  const products   = await prisma.product.findMany({ where: { id: { in: productIds } } })

  const enriched = body.ingredients.map((i: any) => ({
    quantity_grams: Number(i.quantity_grams),
    product: products.find(p => p.id === Number(i.product_id))!,
  }))

  const nutrition = calculateDishNutrition(enriched)

  try {
    const dish = await prisma.dish.create({
      data: {
        name:         body.name.trim(),
        category:     body.category ?? 'lunch',
        cooking_time: body.cooking_time ? Number(body.cooking_time) : null,
        notes:        body.notes ?? null,
        servings:     body.servings ? Number(body.servings) : 1,
        ...nutrition,
        ingredients: {
          create: body.ingredients.map((i: any) => ({
            product_id:    Number(i.product_id),
            quantity_grams: Number(i.quantity_grams),
          })),
        },
      },
      include: { ingredients: { include: { product: true } } },
    })
    return dish
  } catch (e: any) {
    if (e.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'Блюдо с таким названием уже существует' })
    throw e
  }
})
