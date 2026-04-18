// server/routes/api/auth/logout.post.ts
export default defineEventHandler((event) => {
  setCookie(event, 'auth_token', '', { maxAge: 0, path: '/' })
  return { ok: true }
})
