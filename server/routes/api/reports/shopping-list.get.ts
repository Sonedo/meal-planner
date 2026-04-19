// server/routes/api/reports/shopping-list.get.ts
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const query   = getQuery(event)
  const from    = query.from as string
  const to      = query.to   as string
  const family  = query.family === 'true'

  if (!from || !to)
    throw createError({ statusCode: 400, statusMessage: 'Обязательны параметры from и to' })

  let userIds = [session.userId]
  if (family && session.familyId) {
    const members = await prisma.user.findMany({ where: { family_id: session.familyId }, select: { id: true } })
    userIds = members.map(m => m.id)
  }

  const entries = await prisma.mealPlanEntry.findMany({
    where: { user_id: { in: userIds }, date: { gte: from, lte: to } },
    include: {
      dish: { include: { ingredients: { include: { product: true } } } },
      extraIngredients: { include: { product: true } },
    },
  })

  const aggregated = new Map<number, { product_id: number; name: string; category: string; total_grams: number }>()

  function addToMap(product_id: number, name: string, category: string, grams: number) {
    const ex = aggregated.get(product_id)
    if (ex) ex.total_grams += grams
    else aggregated.set(product_id, { product_id, name, category, total_grams: grams })
  }

  for (const entry of entries) {
    const factor = entry.portions / (entry.dish.servings || 1)
    // Основные ингредиенты блюда
    for (const ing of entry.dish.ingredients)
      addToMap(ing.product_id, ing.product.name, ing.product.category, ing.quantity_grams * factor)
    // Доп. ингредиенты (кастомизация) — умножаем на порции
    for (const ex of entry.extraIngredients)
      addToMap(ex.product_id, ex.product.name, ex.product.category, ex.quantity_grams * entry.portions)
  }

  const grouped: Record<string, Array<{ product_id: number; name: string; total_grams: number }>> = {}
  for (const item of aggregated.values()) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push({ product_id: item.product_id, name: item.name, total_grams: Math.round(item.total_grams) })
  }
  for (const cat of Object.keys(grouped)) grouped[cat].sort((a, b) => a.name.localeCompare(b.name))

  return { from, to, family_mode: family && !!session.familyId, total_entries: entries.length, categories: grouped }
})
