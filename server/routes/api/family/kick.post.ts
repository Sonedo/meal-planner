// server/routes/api/family/kick.post.ts — исключить участника из семьи (только владелец)
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body    = await readBody(event)
  const targetId = Number(body.user_id)

  if (!targetId) throw createError({ statusCode: 400, statusMessage: 'Укажите user_id' })
  if (targetId === session.userId) throw createError({ statusCode: 400, statusMessage: 'Нельзя исключить себя — используйте «Покинуть семью»' })

  // Проверяем что текущий пользователь — владелец
  const me = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!me?.family_id || me.family_role !== 'owner')
    throw createError({ statusCode: 403, statusMessage: 'Только владелец может исключать участников' })

  // Проверяем что исключаемый — в той же семье
  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target || target.family_id !== me.family_id)
    throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден в вашей семье' })

  await prisma.user.update({
    where: { id: targetId },
    data: { family_id: null, family_role: null },
  })

  return { ok: true }
})
