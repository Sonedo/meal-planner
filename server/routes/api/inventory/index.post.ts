import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)
  const body    = await readBody(event)

  if (!body.product_id || body.quantity === undefined)
    throw createError({ statusCode: 400, statusMessage: 'Нужны product_id и quantity' })

  const quantity = Number(body.quantity)
  if (quantity < 0)
    throw createError({ statusCode: 400, statusMessage: 'Количество не может быть отрицательным' })

  const isFamily = body.scope === 'family' && !!session.familyId

  // Upsert — обновляем если уже есть такой продукт в том же инвентаре
  const existing = await prisma.inventoryItem.findFirst({
    where: {
      product_id: Number(body.product_id),
      ...(isFamily ? { family_id: session.familyId } : { user_id: session.userId, family_id: null }),
    }
  })

  if (existing) {
    const item = await prisma.inventoryItem.update({
      where: { id: existing.id },
      data: { quantity, unit: body.unit ?? 'г', note: body.note ?? null },
      include: { product: true },
    })
    return item
  }

  const item = await prisma.inventoryItem.create({
    data: {
      product_id: Number(body.product_id),
      user_id:    session.userId,
      family_id:  isFamily ? session.familyId : null,
      quantity,
      unit:       body.unit ?? 'г',
      note:       body.note ?? null,
    },
    include: { product: true },
  })
  return item
})
