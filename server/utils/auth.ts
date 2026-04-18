// server/utils/auth.ts
import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

// ВАЖНО: читаем SECRET через функцию, не на уровне модуля.
// Модуль загружается до того как .env попадает в process.env,
// поэтому константа на верхнем уровне всегда получает дефолт.
function getSecret(): string {
  return process.env.JWT_SECRET || 'nutriplan-jwt-secret-change-in-production'
}

export interface JwtPayload {
  userId: number
  login:  string
}

export interface Session extends JwtPayload {
  familyId: number | null
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '30d' })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload
  } catch {
    return null
  }
}

function extractToken(event: H3Event): string | null {
  const authHeader = getHeader(event, 'authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7)
  const cookies = parseCookies(event)
  return cookies.auth_token ?? null
}

export async function getSession(event: H3Event): Promise<Session | null> {
  const token = extractToken(event)
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const { prisma } = await import('~/server/utils/prisma')
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, login: true, family_id: true },
  })
  if (!user) return null

  return { userId: user.id, login: user.login, familyId: user.family_id }
}

export async function requireSession(event: H3Event): Promise<Session> {
  const session = await getSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Необходима авторизация' })
  }
  return session
}

export function validatePassword(password: string): string | null {
  if (password.length < 8)
    return 'Пароль должен содержать минимум 8 символов'
  if (!/[A-Z]/.test(password))
    return 'Пароль должен содержать хотя бы одну заглавную букву'
  if (!/[a-z]/.test(password))
    return 'Пароль должен содержать хотя бы одну строчную букву'
  if (!/[0-9]/.test(password))
    return 'Пароль должен содержать хотя бы одну цифру'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
    return 'Пароль должен содержать хотя бы один специальный символ (!@#$%^&* и др.)'
  return null
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
