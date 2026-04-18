// server/routes/api/family/index.get.ts — получить состав семьи
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const user = await prisma.user.findUnique({ where: { id: session.userId }, include: { family: true } })
  if (!user?.family_id) throw createError({ statusCode: 404, statusMessage: 'Вы не состоите в семье' })

  const members = await prisma.user.findMany({
    where: { family_id: user.family_id },
    select: { id: true, display_name: true, login: true, family_role: true },
    orderBy: { createdAt: 'asc' },
  })

  return {
    id:          user.family!.id,
    name:        user.family!.name,
    invite_code: user.family_role === 'owner' ? user.family!.invite_code : null,
    members,
  }
})
