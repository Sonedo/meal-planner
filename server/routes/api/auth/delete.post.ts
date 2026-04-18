// server/routes/api/auth/delete.post.ts — удалить аккаунт
import bcrypt from 'bcrypt'
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body    = await readBody(event)

  // Требуем подтверждение паролем
  if (!body.password) throw createError({ statusCode: 400, statusMessage: 'Введите пароль для подтверждения' })

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })

  const valid = await bcrypt.compare(body.password, user.password)
  if (!valid) throw createError({ statusCode: 401, statusMessage: 'Неверный пароль' })

  // Если владелец семьи — передать права или удалить семью
  if (user.family_id && user.family_role === 'owner') {
    const others = await prisma.user.findMany({
      where: { family_id: user.family_id, id: { not: user.id } },
    })
    if (others.length > 0) {
      await prisma.user.update({ where: { id: others[0].id }, data: { family_role: 'owner' } })
    } else {
      await prisma.family.delete({ where: { id: user.family_id } })
    }
  }

  // Удалить все записи плана и самого пользователя (каскад)
  await prisma.user.delete({ where: { id: session.userId } })

  setCookie(event, 'auth_token', '', { maxAge: 0, path: '/' })
  return { ok: true }
})
