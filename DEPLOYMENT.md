# 🚀 Деплой мессенджера

## Вариант 1: Railway.app (Рекомендуется)

### Подготовка проекта

1. **Создайте файл для продакшн сборки:**

```bash
# В корне проекта
npm run build
```

2. **Добавьте в package.json (корень):**
```json
{
  "scripts": {
    "start": "cd server && node index.js",
    "build": "cd client && npm run build"
  }
}
```

### Деплой на Railway

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Нажмите "New Project" → "Deploy from GitHub repo"
3. Выберите ваш репозиторий
4. Railway автоматически определит Node.js проект

### Настройка переменных окружения

В Railway добавьте переменные:
```
NODE_ENV=production
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
JWT_REFRESH_SECRET=другой-секретный-ключ-минимум-32-символа
PORT=3001
ALLOWED_ORIGINS=https://ваш-домен.railway.app
```

### Получение домена

Railway автоматически даст вам домен типа:
`https://ваш-проект.up.railway.app`

Можно подключить свой домен в настройках.

---

## Вариант 2: Vercel (Фронт) + Render (Бэк)

### Фронтенд на Vercel

1. Зарегистрируйтесь на [vercel.com](https://vercel.com)
2. Импортируйте проект из GitHub
3. Настройки:
   - Framework: Vite
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. Добавьте переменную окружения:
```
VITE_API_URL=https://ваш-бэкенд.onrender.com
```

### Бэкенд на Render

1. Зарегистрируйтесь на [render.com](https://render.com)
2. New → Web Service
3. Подключите GitHub репозиторий
4. Настройки:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node index.js`

5. Добавьте переменные окружения (как в Railway)

---

## Вариант 3: VPS (Полный контроль)

### Требования
- Ubuntu 22.04 LTS
- Node.js 18+
- Nginx
- SSL сертификат (Let's Encrypt)

### Быстрая установка

```bash
# 1. Обновление системы
sudo apt update && sudo apt upgrade -y

# 2. Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Установка Nginx
sudo apt install -y nginx

# 4. Клонирование проекта
git clone https://github.com/ваш-репозиторий.git
cd проект

# 5. Установка зависимостей
npm run setup

# 6. Сборка фронтенда
cd client && npm run build && cd ..

# 7. Настройка .env
cp server/.env.example server/.env
nano server/.env  # Заполните переменные

# 8. Запуск с PM2
sudo npm install -g pm2
cd server
pm2 start index.js --name messenger
pm2 startup
pm2 save

# 9. Настройка Nginx
sudo nano /etc/nginx/sites-available/messenger
```

**Конфигурация Nginx:**
```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    # Фронтенд
    location / {
        root /путь/к/проект/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Активация конфига
sudo ln -s /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. SSL сертификат
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ваш-домен.com
```

---

## 🔄 Обновление после деплоя

### Railway/Render
Просто пушьте в GitHub - автоматически задеплоится:
```bash
git add .
git commit -m "Update"
git push
```

### VPS
```bash
cd /путь/к/проект
git pull
cd client && npm run build && cd ..
cd server
pm2 restart messenger
```

---

## 📊 Мониторинг

### Railway/Render
- Встроенные логи в панели управления
- Метрики использования ресурсов

### VPS
```bash
# Логи
pm2 logs messenger

# Статус
pm2 status

# Мониторинг
pm2 monit
```

---

## 💡 Советы

1. **Используйте переменные окружения** - никогда не коммитьте .env
2. **Настройте CORS** правильно для вашего домена
3. **Включите HTTPS** обязательно
4. **Делайте бэкапы БД** регулярно
5. **Мониторьте логи** на ошибки

---

## 🆘 Проблемы?

**WebSocket не работает:**
- Проверьте CORS и ALLOWED_ORIGINS
- Убедитесь что Nginx проксирует /socket.io

**База данных не работает:**
- Проверьте что папка data/ существует
- Права доступа: `chmod 755 server/data`

**Статика не загружается:**
- Проверьте пути в Nginx
- Убедитесь что `npm run build` выполнился

---

## 🎉 Готово!

Ваш мессенджер теперь доступен по адресу!
Можете продолжать разработку локально и пушить изменения.
