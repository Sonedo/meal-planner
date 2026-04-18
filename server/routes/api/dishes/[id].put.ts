// server/routes/api/dishes/[id].put.ts
import { prisma } from '~/server/utils/prisma'
import { calculateDishNutrition } from '~/server/utils/nutrition'

export default defineEventHandler(async (event) => {
  const id   = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const productIds = (body.ingredients ?? []).map((i: any) => Number(i.product_id))
  const products   = await prisma.product.findMany({ where: { id: { in: productIds } } })

  const enriched = (body.ingredients ?? []).map((i: any) => ({
    quantity_grams: Number(i.quantity_grams),
    product: products.find(p => p.id === Number(i.product_id))!,
  }))

  const nutrition = calculateDishNutrition(enriched)

  try {
    await prisma.dishIngredient.deleteMany({ where: { dish_id: id } })

    const dish = await prisma.dish.update({
      where: { id },
      data: {
        name:         body.name?.trim(),
        category:     body.category,
        cooking_time: body.cooking_time ? Number(body.cooking_time) : null,
        notes:        body.notes ?? null,
        servings:     body.servings ? Number(body.servings) : 1,
        ...nutrition,
        ingredients: {
          create: (body.ingredients ?? []).map((i: any) => ({
            product_id:    Number(i.product_id),
            quantity_grams: Number(i.quantity_grams),
          })),
        },
      },
      include: { ingredients: { include: { product: true } } },
    })
    return dish
  } catch (e: any) {
    if (e.code === 'P2025') throw createError({ statusCode: 404, statusMessage: 'Блюдо не найдено' })
    if (e.code === 'P2002') throw createError({ statusCode: 409, statusMessage: 'Такое название уже занято' })
    throw e
  }
})
