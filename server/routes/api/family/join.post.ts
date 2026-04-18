// server/routes/api/family/join.post.ts — вступить по коду
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body    = await readBody(event)

  const code = body.invite_code?.trim().toUpperCase()
  if (!code) throw createError({ statusCode: 400, statusMessage: 'Укажите код приглашения' })

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (user?.family_id) throw createError({ statusCode: 409, statusMessage: 'Вы уже состоите в семье' })

  const family = await prisma.family.findUnique({ where: { invite_code: code } })
  if (!family) throw createError({ statusCode: 404, statusMessage: 'Семья с таким кодом не найдена' })

  await prisma.user.update({
    where: { id: session.userId },
    data: { family_id: family.id, family_role: 'member' },
  })

  const members = await prisma.user.findMany({
    where: { family_id: family.id },
    select: { id: true, display_name: true, family_role: true },
  })

  return { id: family.id, name: family.name, members }
})
