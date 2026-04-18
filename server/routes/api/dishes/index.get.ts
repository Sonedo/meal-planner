// server/routes/api/dishes/index.get.ts
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query    = getQuery(event)
  const category = query.category as string | undefined

  const dishes = await prisma.dish.findMany({
    where: category ? { category } : undefined,
    include: {
      ingredients: {
        include: { product: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return dishes
})
