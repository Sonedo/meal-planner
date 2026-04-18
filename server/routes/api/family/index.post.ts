// server/routes/api/family/index.post.ts — создать семью
import { prisma } from '~/server/utils/prisma'
import { requireSession, generateInviteCode } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body    = await readBody(event)

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })
  if (user.family_id) throw createError({ statusCode: 409, statusMessage: 'Вы уже состоите в семье' })

  const name = body.name?.trim()
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Укажите название семьи' })

  // Generate unique invite code
  let invite_code = generateInviteCode()
  while (await prisma.family.findUnique({ where: { invite_code } })) {
    invite_code = generateInviteCode()
  }

  const family = await prisma.family.create({ data: { name, invite_code } })

  await prisma.user.update({
    where: { id: session.userId },
    data: { family_id: family.id, family_role: 'owner' },
  })

  return { id: family.id, name: family.name, invite_code: family.invite_code }
})
