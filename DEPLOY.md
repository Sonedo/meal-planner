# Развёртывание НутриПлан

## Требования

Node.js 20+:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Установка

```bash
cd ~
git clone https://github.com/Sonedo/meal-planner.git
cd meal-planner

cp .env.example .env
nano .env
```

---

## Переменные окружения (.env)

| Переменная      | Пример                                  | Описание                                    |
|-----------------|-----------------------------------------|---------------------------------------------|
| `DATABASE_URL`  | `file:/home/apronin/meal-planner/prod.db` | Абсолютный путь к SQLite                  |
| `PORT`          | `3001`                                  | Порт Node.js сервера                        |
| `JWT_SECRET`    | `openssl rand -hex 32`                  | Секрет JWT                                  |
| `NODE_ENV`      | `production`                            | Режим                                       |
| `APP_BASE_URL`  | `/wfqwefqefq23f1`                       | Префикс пути — **должен совпадать с nginx** |

**Важно:** `APP_BASE_URL` встраивается в сборку при `npm run build`.
При смене префикса нужно пересобрать приложение.

---

## Сборка и запуск

```bash
npm run prod:setup
```

Systemd:
```bash
sudo nano /etc/systemd/system/nutriplan.service
```

```ini
[Unit]
Description=НутриПлан
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/apronin/meal-planner
ExecStart=node --env-file=.env .output/server/index.mjs
Restart=on-failure
RestartSec=5
User=apronin

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable nutriplan
sudo systemctl start nutriplan
```

---

## Nginx

```nginx
server {
    listen 80;
    server_name domain.com;

    # НутриПлан — префикс совпадает с APP_BASE_URL в .env
    location /wfqwefqefq23f1/ {
        proxy_pass         http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Другие приложения
    location /other-app/ {
        proxy_pass http://127.0.0.1:3002/;
    }

    location / {
        return 404;
    }
}
```

```bash
sudo certbot --nginx -d domain.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## Обновление

```bash
cd ~/meal-planner
git pull
npm install
node --env-file=.env ./node_modules/.bin/prisma db push
npm run build           # пересборка обязательна если менялся APP_BASE_URL
sudo systemctl restart nutriplan
```

---

## Тестовый аккаунт

- Логин: `admin`  
- Пароль: `Test123!`
