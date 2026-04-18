// server/routes/api/debug.get.ts
// ВРЕМЕННЫЙ эндпоинт для диагностики — удалить после исправления проблемы
export default defineEventHandler((event) => {
  const cookies = parseCookies(event)
  const hasToken = !!cookies.auth_token
  const tokenPreview = hasToken ? cookies.auth_token.substring(0, 20) + '...' : 'отсутствует'

  return {
    env: {
      NODE_ENV:     process.env.NODE_ENV     || '(не задан)',
      DATABASE_URL: process.env.DATABASE_URL ? '✓ задан' : '✗ НЕ ЗАДАН',
      JWT_SECRET:   process.env.JWT_SECRET   ? '✓ задан' : '✗ НЕ ЗАДАН — используется дефолт!',
      PORT:         process.env.PORT         || '(не задан)',
    },
    cookie: {
      auth_token: tokenPreview,
      all_cookies: Object.keys(cookies),
    },
  }
})
