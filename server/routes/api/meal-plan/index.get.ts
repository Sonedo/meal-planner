// server/routes/api/meal-plan/index.get.ts
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const query   = getQuery(event)
  const from    = query.from as string | undefined
  const to      = query.to   as string | undefined
  const family  = query.family === 'true'

  let userIds = [session.userId]
  if (family && session.familyId) {
    const members = await prisma.user.findMany({ where: { family_id: session.familyId }, select: { id: true } })
    userIds = members.map(m => m.id)
  }

  const where: any = { user_id: { in: userIds } }
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = from
    if (to)   where.date.lte = to
  }

  const entries = await prisma.mealPlanEntry.findMany({
    where,
    include: {
      user:            { select: { id: true, display_name: true } },
      dish:            { include: { ingredients: { include: { product: true } } } },
      extraIngredients:    { include: { product: true } },
      excludedIngredients: { include: { product: true } },
    },
    orderBy: [{ date: 'asc' }, { meal_type: 'asc' }],
  })

  return entries
})
