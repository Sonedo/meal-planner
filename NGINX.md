# Настройка Nginx

## Ключевое правило

`proxy_pass` указывается **без слэша в конце** и **без пути** — тогда nginx
передаёт URL в Node как есть, включая префикс. Node/Nuxt сам знает о префиксе
через `APP_BASE_URL` и обрабатывает его корректно.

```nginx
server {
    listen 80;
    server_name domain.com;

    # ✅ Правильно — без слэша в конце proxy_pass
    location /wfqwefqefq23f1/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_set_header   X-Real-IP  $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }

    # ❌ Неправильно — слэш обрезает префикс, Nuxt его не видит → редиректы
    # proxy_pass http://127.0.0.1:3001/;
}
```

## Как работает

```
Браузер  →  GET /wfqwefqefq23f1/login
Nginx    →  proxy_pass без слэша → Node получает /wfqwefqefq23f1/login
Node     →  APP_BASE_URL=/wfqwefqefq23f1 → роутер находит /login → OK
```

## .env должен совпадать с location

```env
APP_BASE_URL=/wfqwefqefq23f1
```

```nginx
location /wfqwefqefq23f1/ { ... }
```

## Несколько приложений на одном домене

```nginx
server {
    listen 443 ssl;
    server_name domain.com;

    location /app1secret/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /app2secret/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location / {
        return 404;
    }
}
```
