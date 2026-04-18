// server/routes/api/auth/login.post.ts
import bcrypt from 'bcrypt'
import { prisma } from '~/server/utils/prisma'
import { signToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { login, password } = body

  if (!login || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Логин и пароль обязательны' })
  }

  const user = await prisma.user.findUnique({
    where: { login: login.trim() },
    include: { family: true },
  })

  if (!user) throw createError({ statusCode: 401, statusMessage: 'Неверный логин или пароль' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw createError({ statusCode: 401, statusMessage: 'Неверный логин или пароль' })

  const token = signToken({ userId: user.id, login: user.login, familyId: user.family_id })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  return {
    user: {
      id:           user.id,
      login:        user.login,
      display_name: user.display_name,
      family_id:    user.family_id,
      family_role:  user.family_role,
      family_name:  user.family?.name ?? null,
    },
    token,
  }
})
