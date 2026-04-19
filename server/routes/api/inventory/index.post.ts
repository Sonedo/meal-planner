import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body    = await readBody(event)

  if (!body.product_id)
    throw createError({ statusCode: 400, statusMessage: 'Нужен product_id' })

  const isFamily = body.scope === 'family' && !!session.familyId

  const existing = await prisma.inventoryItem.findFirst({
    where: {
      product_id: Number(body.product_id),
      ...(isFamily ? { family_id: session.familyId } : { user_id: session.userId, family_id: null }),
    }
  })

  if (existing) {
    // Обновляем заметку если передана
    const item = await prisma.inventoryItem.update({
      where: { id: existing.id },
      data: { note: body.note ?? existing.note },
      include: { product: true },
    })
    return item
  }

  const item = await prisma.inventoryItem.create({
    data: {
      product_id: Number(body.product_id),
      user_id:    session.userId,
      family_id:  isFamily ? session.familyId : null,
      note:       body.note ?? null,
    },
    include: { product: true },
  })
  return item
})
