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

  // Собираем уникальные продукты из плана
  const needed = new Map<number, { product_id: number; name: string; category: string }>()

  for (const entry of entries) {
    for (const ing of entry.dish.ingredients)
      needed.set(ing.product_id, { product_id: ing.product_id, name: ing.product.name, category: ing.product.category })
    for (const ex of (entry as any).extraIngredients ?? [])
      needed.set(ex.product_id, { product_id: ex.product_id, name: ex.product.name, category: ex.product.category })
  }

  // Инвентарь — просто Set наличия
  const inventoryWhere: any = { OR: [{ user_id: session.userId }] }
  if (session.familyId) inventoryWhere.OR.push({ family_id: session.familyId })
  const inventory = await prisma.inventoryItem.findMany({ where: inventoryWhere, select: { product_id: true } })
  const inStock = new Set<number>(inventory.map(i => i.product_id))

  // Разделяем: есть / нет
  const result = Array.from(needed.values()).map(item => ({
    ...item,
    covered: inStock.has(item.product_id),
  }))

  result.sort((a, b) => {
    if (a.covered !== b.covered) return a.covered ? 1 : -1
    return a.name.localeCompare(b.name)
  })

  return { from, to, items: result }
})
