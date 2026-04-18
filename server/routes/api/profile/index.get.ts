import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'
import { calcNutritionGoals } from '~/server/utils/nutrition-calc'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const profile = await prisma.userProfile.findUnique({ where: { user_id: session.userId } })

  const goals = profile ? calcNutritionGoals(profile) : null
  return { profile: profile ?? null, goals }
})
