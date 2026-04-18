import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'
import { calcNutritionGoals } from '~/server/utils/nutrition-calc'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body    = await readBody(event)

  const data = {
    gender:     body.gender     ?? 'male',
    birth_year: body.birth_year ? Number(body.birth_year) : null,
    height_cm:  body.height_cm  ? Number(body.height_cm)  : null,
    weight_kg:  body.weight_kg  ? Number(body.weight_kg)  : null,
    activity:   body.activity   ?? 'moderate',
    goal:       body.goal       ?? 'maintain',
  }

  const profile = await prisma.userProfile.upsert({
    where:  { user_id: session.userId },
    update: data,
    create: { user_id: session.userId, ...data },
  })

  const goals = calcNutritionGoals(profile)
  return { profile, goals }
})
