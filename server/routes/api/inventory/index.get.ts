import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  // Показываем: личные + семейные (если есть семья)
  const where: any = {
    OR: [{ user_id: session.userId }]
  }
  if (session.familyId) {
    where.OR.push({ family_id: session.familyId })
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    include: { product: true },
    orderBy: [{ product: { category: 'asc' } }, { product: { name: 'asc' } }],
  })

  return items
})
