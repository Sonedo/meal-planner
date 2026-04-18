// server/utils/prisma.ts
import { PrismaClient } from '@prisma/client'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Prisma с относительным путём (file:./...) резолвит его от CWD процесса,
// а не от файла схемы. При запуске из .output/server/ это ломается.
// Решение: всегда указывать абсолютный путь к БД.
function getDbUrl(): string {
  const url = process.env.DATABASE_URL || 'file:./prisma/prod.db'

  // Если уже абсолютный путь — оставляем как есть
  // Абсолютные: file:/opt/... или file:D:/...
  if (/^file:[/\\]/.test(url) || /^file:[a-zA-Z]:/.test(url)) {
    return url
  }

  // Относительный путь — резолвим от корня проекта
  // __filename в ESM недоступен через __dirname, используем import.meta.url
  // но этот файл может быть скомпилирован, поэтому идём от CWD вверх
  const relativePath = url.replace(/^file:\.?\//, '')

  // Пробуем найти корень проекта (где лежит package.json)
  let projectRoot = process.cwd()
  // Если запущено из .output/server — поднимаемся на 2 уровня
  if (projectRoot.includes('.output')) {
    projectRoot = resolve(projectRoot, '..', '..')
  }

  const absolutePath = resolve(projectRoot, relativePath)
  return `file:${absolutePath}`
}

// Устанавливаем абсолютный путь до создания клиента
const resolvedUrl = getDbUrl()
if (resolvedUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = resolvedUrl
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma: PrismaClient = globalThis.__prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}
