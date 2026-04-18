// server/routes/api/products/index.get.ts
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = (query.search as string) ?? ''

  const products = await prisma.product.findMany({
    where: search
      ? { name: { contains: search, mode: 'insensitive' } }
      : undefined,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return products
})
