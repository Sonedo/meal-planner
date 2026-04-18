// server/routes/api/auth/register.post.ts
import bcrypt from 'bcrypt'
import { prisma } from '~/server/utils/prisma'
import { signToken, validatePassword } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { login, password, display_name } = body

  if (!login || typeof login !== 'string' || login.trim().length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Логин должен содержать минимум 2 символа' })
  }
  if (!display_name || typeof display_name !== 'string' || display_name.trim().length < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Укажите отображаемое имя' })
  }

  const pwError = validatePassword(password ?? '')
  if (pwError) throw createError({ statusCode: 400, statusMessage: pwError })

  const existing = await prisma.user.findUnique({ where: { login: login.trim() } })
  if (existing) throw createError({ statusCode: 409, statusMessage: 'Такой логин уже занят' })

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { login: login.trim(), password: hash, display_name: display_name.trim() },
  })

  const token = signToken({ userId: user.id, login: user.login, familyId: user.family_id })

  // Set cookie (30 days)
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  return {
    user: { id: user.id, login: user.login, display_name: user.display_name, family_id: null },
    token,
  }
})
