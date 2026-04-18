// server/routes/api/reports/prep-summary.get.ts
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
  if (family && session.familyId) {
    const members = await prisma.user.findMany({ where: { family_id: session.familyId }, select: { id: true } })
    userIds = members.map(m => m.id)
  }

  const entries = await prisma.mealPlanEntry.findMany({
    where: { user_id: { in: userIds }, date: { gte: from, lte: to } },
    include: { dish: { include: { ingredients: { include: { product: true } } } } },
    orderBy: { date: 'asc' },
  })

  const MEAL_LABELS: Record<string, string> = { breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус' }
  const dishMap = new Map<number, { dish: any; total_portions: number; dates: string[]; meal_types: string[] }>()

  for (const entry of entries) {
    const ex = dishMap.get(entry.dish_id)
    if (ex) {
      ex.total_portions += entry.portions
      if (!ex.dates.includes(entry.date)) ex.dates.push(entry.date)
      if (!ex.meal_types.includes(entry.meal_type)) ex.meal_types.push(entry.meal_type)
    } else {
      dishMap.set(entry.dish_id, { dish: entry.dish, total_portions: entry.portions, dates: [entry.date], meal_types: [entry.meal_type] })
    }
  }

  const CAT_ORDER = ['breakfast', 'lunch', 'dinner', 'snack']
  const result = Array.from(dishMap.values()).map(({ dish, total_portions, dates, meal_types }) => {
    const servings = dish.servings || 1
    const factor   = total_portions / servings
    return {
      id: dish.id, name: dish.name, category: dish.category,
      cooking_time: dish.cooking_time, notes: dish.notes, servings: dish.servings, total_portions,
      nutrition: { calories: round1(dish.total_calories*factor), protein: round1(dish.total_protein*factor), fat: round1(dish.total_fat*factor), carbs: round1(dish.total_carbs*factor) },
      per_portion: { calories: round1(dish.total_calories/servings), protein: round1(dish.total_protein/servings), fat: round1(dish.total_fat/servings), carbs: round1(dish.total_carbs/servings) },
      ingredients: dish.ingredients.map((ing: any) => ({ product: ing.product.name, category: ing.product.category, quantity_grams: round1(ing.quantity_grams*factor) })),
      used_on_dates: dates.sort(),
      meal_types: meal_types.map(m => MEAL_LABELS[m] ?? m),
    }
  })
  result.sort((a, b) => { const ao = CAT_ORDER.indexOf(a.category), bo = CAT_ORDER.indexOf(b.category); return ao !== bo ? ao-bo : a.name.localeCompare(b.name) })

  return { from, to, family_mode: family && !!session.familyId, dishes: result }
})
