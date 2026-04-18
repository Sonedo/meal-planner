// Поиск рецептов по наличию продуктов в инвентаре
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session  = await requireSession(event)
  const query    = getQuery(event)
  // missing: максимальное кол-во недостающих ингредиентов (0 = есть всё, 1, 2, 3)
  const maxMissing = Number(query.missing ?? 0)

  // Инвентарь пользователя + семьи
  const inventoryWhere: any = { OR: [{ user_id: session.userId }] }
  if (session.familyId) inventoryWhere.OR.push({ family_id: session.familyId })
  const inventory = await prisma.inventoryItem.findMany({ where: inventoryWhere })

  const inStock = new Set<number>(inventory.map(i => i.product_id))

  // Все блюда с ингредиентами
  const dishes = await prisma.dish.findMany({
    include: { ingredients: { include: { product: true } } },
  })

  const results = []
  for (const dish of dishes) {
    if (dish.ingredients.length === 0) continue

    const missing: Array<{ product_id: number; name: string }> = []
    for (const ing of dish.ingredients) {
      if (!inStock.has(ing.product_id)) {
        missing.push({ product_id: ing.product_id, name: ing.product.name })
      }
    }

    if (missing.length <= maxMissing) {
      results.push({
        id:            dish.id,
        name:          dish.name,
        category:      dish.category,
        cooking_time:  dish.cooking_time,
        servings:      dish.servings,
        total_calories: dish.total_calories,
        per_portion:   Math.round(dish.total_calories / (dish.servings || 1)),
        missing_count: missing.length,
        missing,
        total_ingredients: dish.ingredients.length,
      })
    }
  }

  // Сортировка: меньше недостающих → сначала
  results.sort((a, b) => a.missing_count - b.missing_count || a.name.localeCompare(b.name))

  return { max_missing: maxMissing, total: results.length, dishes: results }
})
