// server/routes/api/family/leave.post.ts — покинуть семью
import { prisma } from '~/server/utils/prisma'
import { requireSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user?.family_id) throw createError({ statusCode: 400, statusMessage: 'Вы не состоите в семье' })

  // If owner leaves — check if there are other members
  if (user.family_role === 'owner') {
    const otherMembers = await prisma.user.findMany({
      where: { family_id: user.family_id, id: { not: user.id } },
    })
    if (otherMembers.length > 0) {
      // Transfer ownership to first other member
      await prisma.user.update({
        where: { id: otherMembers[0].id },
        data: { family_role: 'owner' },
      })
    } else {
      // Last member — delete the family
      await prisma.family.delete({ where: { id: user.family_id } })
    }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { family_id: null, family_role: null },
  })

  return { ok: true }
})
