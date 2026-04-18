import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const id      = Number(getRouterParam(event, 'id'))

  const item = await prisma.inventoryItem.findUnique({ where: { id } })
  if (!item) throw createError({ statusCode: 404, statusMessage: 'Позиция не найдена' })

  // Удалить может: сам добавивший, или владелец семьи
  const me = await prisma.user.findUnique({ where: { id: session.userId } })
  const canDelete = item.user_id === session.userId ||
    (me?.family_role === 'owner' && item.family_id === session.familyId)

  if (!canDelete) throw createError({ statusCode: 403, statusMessage: 'Нет прав' })

  await prisma.inventoryItem.delete({ where: { id } })
  return { ok: true }
})
