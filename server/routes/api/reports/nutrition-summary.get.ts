// server/routes/api/reports/nutrition-summary.get.ts
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'
import { round1 } from '~/server/utils/nutrition'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const query   = getQuery(event)
  const from    = query.from as string
  const to      = query.to   as string
  const family  = query.family === 'true'

  if (!from || !to)
    throw createError({ statusCode: 400, statusMessage: 'Обязательны параметры from и to (ГГГГ-ММ-ДД)' })

  let userIds = [session.userId]
  let userMap: Record<number, string> = { [session.userId]: 'Вы' }

  if (family && session.familyId) {
    const members = await prisma.user.findMany({
      where: { family_id: session.familyId }, select: { id: true, display_name: true },
    })
    userIds = members.map(m => m.id)
    userMap = Object.fromEntries(members.map(m => [m.id, m.display_name]))
  }

  const entries = await prisma.mealPlanEntry.findMany({
    where: { user_id: { in: userIds }, date: { gte: from, lte: to } },
    include: {
      dish: true,
      extraIngredients: { include: { product: true } },
      user: { select: { id: true } },
    },
    orderBy: { date: 'asc' },
  })

  const byUserDay = new Map<string, { userId: number; date: string; cal: number; prot: number; fat: number; carbs: number }>()

  for (const entry of entries) {
    const factor = entry.portions / (entry.dish.servings || 1)

    // Базовые нутриенты блюда
    let cal   = entry.dish.total_calories * factor
    let prot  = entry.dish.total_protein  * factor
    let fat   = entry.dish.total_fat      * factor
    let carbs = entry.dish.total_carbs    * factor

    // Доп. ингредиенты — на количество порций
    for (const ex of entry.extraIngredients) {
      const f = ex.quantity_grams * entry.portions / 100
      cal   += ex.product.calories_per_100g * f
      prot  += ex.product.protein_per_100g  * f
      fat   += ex.product.fat_per_100g      * f
      carbs += ex.product.carbs_per_100g    * f
    }

    const key = `${entry.user_id}::${entry.date}`
    const d = byUserDay.get(key) ?? { userId: entry.user_id, date: entry.date, cal: 0, prot: 0, fat: 0, carbs: 0 }
    d.cal += cal; d.prot += prot; d.fat += fat; d.carbs += carbs
    byUserDay.set(key, d)
  }

  const rows = Array.from(byUserDay.values())

  const byDay = new Map<string, { calories: number; protein: number; fat: number; carbs: number }>()
  for (const r of rows) {
    const d = byDay.get(r.date) ?? { calories: 0, protein: 0, fat: 0, carbs: 0 }
    d.calories += r.cal; d.protein += r.prot; d.fat += r.fat; d.carbs += r.carbs
    byDay.set(r.date, d)
  }

  const days = Array.from(byDay.entries()).map(([date, n]) => ({
    date,
    calories: round1(n.calories), protein: round1(n.protein), fat: round1(n.fat), carbs: round1(n.carbs),
  }))

  const numDays = days.length || 1
  const totals  = days.reduce((a, d) => ({
    calories: a.calories + d.calories, protein: a.protein + d.protein,
    fat: a.fat + d.fat, carbs: a.carbs + d.carbs,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 })

  const by_member = family ? userIds.map(uid => {
    const mr = rows.filter(r => r.userId === uid)
    const t  = mr.reduce((a, r) => ({ cal: a.cal+r.cal, prot: a.prot+r.prot, fat: a.fat+r.fat, carbs: a.carbs+r.carbs }), { cal:0, prot:0, fat:0, carbs:0 })
    return { user_id: uid, display_name: userMap[uid] ?? '?', calories: round1(t.cal), protein: round1(t.prot), fat: round1(t.fat), carbs: round1(t.carbs) }
  }) : null

  return {
    from, to, family_mode: family && !!session.familyId,
    days_with_data: days.length,
    total: { calories: round1(totals.calories), protein: round1(totals.protein), fat: round1(totals.fat), carbs: round1(totals.carbs) },
    average_per_day: { calories: round1(totals.calories/numDays), protein: round1(totals.protein/numDays), fat: round1(totals.fat/numDays), carbs: round1(totals.carbs/numDays) },
    by_day: days,
    by_member,
  }
})
