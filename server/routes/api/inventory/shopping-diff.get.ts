// Сравнивает список покупок с инвентарём — возвращает что реально нужно купить
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const query   = getQuery(event)
  const from    = query.from as string
  const to      = query.to   as string
  const family  = query.family === 'true'

  if (!from || !to)
    throw createError({ statusCode: 400, statusMessage: 'Нужны from и to' })

  // 1. Получаем план питания
  let userIds = [session.userId]
  if (family && session.familyId) {
    const members = await prisma.user.findMany({ where: { family_id: session.familyId }, select: { id: true } })
    userIds = members.map(m => m.id)
  }

  const entries = await prisma.mealPlanEntry.findMany({
    where: { user_id: { in: userIds }, date: { gte: from, lte: to } },
    include: { dish: { include: { ingredients: { include: { product: true } } } }, extraIngredients: { include: { product: true } } },
  })

  // 2. Агрегируем нужные ингредиенты
  const needed = new Map<number, { product_id: number; name: string; category: string; needed_grams: number }>()
  for (const entry of entries) {
    const factor = entry.portions / (entry.dish.servings || 1)
    for (const ing of entry.dish.ingredients) {
      const grams = ing.quantity_grams * factor
      const ex = needed.get(ing.product_id)
      if (ex) ex.needed_grams += grams
      else needed.set(ing.product_id, { product_id: ing.product_id, name: ing.product.name, category: ing.product.category, needed_grams: grams })
    }
    // Доп. ингредиенты × порции
    for (const ex of (entry as any).extraIngredients ?? []) {
      const grams = ex.quantity_grams * entry.portions
      const existing = needed.get(ex.product_id)
      if (existing) existing.needed_grams += grams
      else needed.set(ex.product_id, { product_id: ex.product_id, name: ex.product.name, category: ex.product.category, needed_grams: grams })
    }
  }

  // 3. Получаем инвентарь
  const inventoryWhere: any = { OR: [{ user_id: session.userId }] }
  if (session.familyId) inventoryWhere.OR.push({ family_id: session.familyId })
  const inventory = await prisma.inventoryItem.findMany({ where: inventoryWhere })

  const inStock = new Map<number, number>() // product_id → граммы
  for (const item of inventory) {
    inStock.set(item.product_id, (inStock.get(item.product_id) ?? 0) + item.quantity)
  }

  // 4. Вычисляем разницу
  const result = []
  for (const [productId, item] of needed) {
    const have   = inStock.get(productId) ?? 0
    const toBuy  = Math.max(0, item.needed_grams - have)
    result.push({
      product_id:    productId,
      name:          item.name,
      category:      item.category,
      needed_grams:  Math.round(item.needed_grams),
      in_stock_grams: Math.round(have),
      to_buy_grams:  Math.round(toBuy),
      covered:       have >= item.needed_grams,
    })
  }

  result.sort((a, b) => {
    if (a.covered !== b.covered) return a.covered ? 1 : -1 // нужные — сверху
    return a.name.localeCompare(b.name)
  })

  return { from, to, items: result }
})
