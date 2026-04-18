# 🥗 НутриПлан

Планировщик питания с базой продуктов, рецептами, недельным планом и отчётами.

## Стек

- **Nuxt 3** (fullstack, SSR)
- **Vue 3** Composition API
- **Prisma** + SQLite
- **Tailwind CSS**
- **JWT** аутентификация

## Возможности

- 📦 База продуктов с БЖУ на 100г
- 🍳 Конструктор блюд с расчётом питательности
- 📅 Недельный планировщик (несколько блюд в приёме пищи)
- 📊 Отчёты: питание, список покупок, рецепты для заготовок
- 👨‍👩‍👧 Семейный режим — общие покупки, личные планы
- 🔐 Авторизация через логин/пароль

## Локальный запуск

```bash
git clone https://github.com/YOUR_USERNAME/meal-planner.git
cd meal-planner

cp .env.example .env
# Заполнить .env

npm run setup   # install + db + seed
npm run dev     # http://localhost:3000
```

## Production

```bash
cp .env.example .env
# Заполнить .env (абсолютный путь для DATABASE_URL)

npm run prod:setup   # install + db + seed + build
npm run prod:start   # запуск
```

Подробнее — в [DEPLOY.md](./DEPLOY.md).

## Переменные окружения

| Переменная     | Описание                              |
|----------------|---------------------------------------|
| `DATABASE_URL` | Путь к SQLite (абсолютный для prod)   |
| `PORT`         | Порт сервера (по умолчанию 3000)      |
| `JWT_SECRET`   | Секрет для JWT (`openssl rand -hex 32`) |
| `NODE_ENV`     | `production` для prod                 |

## Тестовый аккаунт (после seed)

- Логин: `admin`
- Пароль: `Test123!`
