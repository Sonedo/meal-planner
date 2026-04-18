# Развёртывание НутриПлан

## Требования

- Node.js **20+** — проверить: `node --version`

Установить Node.js 20 на Ubuntu:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Настройка .env

```bash
cp .env.example .env
nano .env
```

**Важно для `DATABASE_URL`** — указывайте **абсолютный путь**:

```bash
# Ubuntu (замените /opt/meal-planner на реальный путь)
DATABASE_URL="file:/opt/meal-planner/prisma/prod.db"

# Windows (для локальной разработки)
DATABASE_URL="file:D:/Dev/Projects/meal-planner/prisma/prod.db"
```

Сгенерировать `JWT_SECRET`:
```bash
openssl rand -hex 32
```

---

## Первый запуск

```bash
cd /opt/meal-planner

# Установить зависимости, создать БД, собрать
npm run prod:setup

# Запустить
npm run prod:start
```

---

## Systemd (автозапуск)

```bash
sudo nano /etc/systemd/system/nutriplan.service
```

```ini
[Unit]
Description=НутриПлан
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/meal-planner
ExecStart=node --env-file=.env .output/server/index.mjs
Restart=on-failure
RestartSec=5
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable nutriplan
sudo systemctl start nutriplan
sudo journalctl -u nutriplan -f   # логи в реальном времени
```

---

## Nginx + SSL

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo nano /etc/nginx/sites-available/nutriplan
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/nutriplan /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Обновление

```bash
cd /opt/meal-planner
node --env-file=.env ./node_modules/.bin/prisma db push   # миграции БД
npm run build
sudo systemctl restart nutriplan
```

---

## Тестовый аккаунт

- Логин: `admin`
- Пароль: `Test123!`

Смените пароль сразу после входа!
