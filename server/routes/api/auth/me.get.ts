// server/routes/api/auth/me.get.ts
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { family: true },
  })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })

  return {
    id:           user.id,
    login:        user.login,
    display_name: user.display_name,
    family_id:    user.family_id,
    family_role:  user.family_role,
    family_name:  user.family?.name ?? null,
    invite_code:  user.family_role === 'owner' ? user.family?.invite_code : null,
  }
})
