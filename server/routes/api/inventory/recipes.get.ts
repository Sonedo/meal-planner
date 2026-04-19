// Поиск рецептов по наличию продуктов в инвентаре
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session    = await requireSession(event)
  const query      = getQuery(event)
  const maxMissing = Number(query.missing ?? 0)

  const inventoryWhere: any = { OR: [{ user_id: session.userId }] }
  if (session.familyId) inventoryWhere.OR.push({ family_id: session.familyId })
  const inventory = await prisma.inventoryItem.findMany({ where: inventoryWhere })
  const inStock   = new Set<number>(inventory.map(i => i.product_id))

  const dishes = await prisma.dish.findMany({
    include: { ingredients: { include: { product: true } } },
  })

  const CAT_LABELS: Record<string, string> = {
    vegetable: 'Овощи', meat: 'Мясо / Рыба', dairy: 'Молочное',
    grain: 'Злаки / Крупы', fruit: 'Фрукты', legume: 'Бобовые',
    oil: 'Масла', other: 'Прочее',
  }

  const results = []
  for (const dish of dishes) {
    if (dish.ingredients.length === 0) continue

    const missing: Array<{ product_id: number; name: string }> = []
    for (const ing of dish.ingredients) {
      if (!inStock.has(ing.product_id))
        missing.push({ product_id: ing.product_id, name: ing.product.name })
    }

    if (missing.length <= maxMissing) {
      results.push({
        id:           dish.id,
        name:         dish.name,
        category:     dish.category,
        cooking_time: dish.cooking_time,
        notes:        dish.notes,
        servings:     dish.servings,
        total_calories: dish.total_calories,
        total_protein:  dish.total_protein,
        total_fat:      dish.total_fat,
        total_carbs:    dish.total_carbs,
        per_portion:  Math.round(dish.total_calories / (dish.servings || 1)),
        missing_count: missing.length,
        missing,
        total_ingredients: dish.ingredients.length,
        // Полный список ингредиентов с пометкой наличия
        ingredients: dish.ingredients.map(ing => ({
          product_id:    ing.product_id,
          name:          ing.product.name,
          category:      ing.product.category,
          category_label: CAT_LABELS[ing.product.category] ?? ing.product.category,
          quantity_grams: ing.quantity_grams,
          in_stock:      inStock.has(ing.product_id),
        })),
      })
    }
  }

  results.sort((a, b) => a.missing_count - b.missing_count || a.name.localeCompare(b.name))
  return { max_missing: maxMissing, total: results.length, dishes: results }
})
