# 🚀 Деплой на российских хостингах

## 🇷🇺 Лучшие варианты для РФ

### 1. **Timeweb Cloud** (Рекомендуется)
- ✅ Российский хостинг
- ✅ Оплата картой РФ
- ✅ PostgreSQL + Redis
- ✅ WebSocket поддержка
- 💰 От 169₽/месяц

### 2. **Selectel**
- ✅ Облачная платформа
- ✅ Kubernetes
- ✅ Оплата российскими картами
- 💰 От 200₽/месяц

### 3. **Beget**
- ✅ Простой в настройке
- ✅ Node.js поддержка
- ✅ Российские карты
- 💰 От 150₽/месяц

### 4. **REG.RU VPS**
- ✅ Полный контроль
- ✅ Российский регистратор доменов
- ✅ Оплата СБП/картами РФ
- 💰 От 299₽/месяц

---

## 🎯 Быстрый старт (Timeweb Cloud)

### Шаг 1: Регистрация

1. Зайдите на [timeweb.cloud](https://timeweb.cloud)
2. Зарегистрируйтесь (можно через VK)
3. Пополните баланс (от 500₽)

### Шаг 2: Создание сервера

1. **Панель управления** → **Облачные серверы** → **Создать сервер**
2. Выберите конфигурацию:
   - **ОС**: Ubuntu 22.04
   - **Тариф**: Базовый (2 CPU, 2GB RAM) - 169₽/мес
   - **Регион**: Москва
3. Создайте сервер и запомните IP-адрес

### Шаг 3: Подключение к серверу

```bash
# Подключитесь по SSH (пароль придет на email)
ssh root@ваш-ip-адрес
```

### Шаг 4: Установка зависимостей

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Установка PostgreSQL
apt install -y postgresql postgresql-contrib

# Установка Redis
apt install -y redis-server

# Установка Nginx
apt install -y nginx

# Установка PM2 (менеджер процессов)
npm install -g pm2

# Установка Git
apt install -y git
```

### Шаг 5: Настройка PostgreSQL

```bash
# Войдите в PostgreSQL
sudo -u postgres psql

# Создайте базу данных и пользователя
CREATE DATABASE messenger;
CREATE USER messenger_user WITH PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE messenger TO messenger_user;
\q
```

### Шаг 6: Загрузка проекта

```bash
# Создайте директорию
mkdir -p /var/www/messenger
cd /var/www/messenger

# Клонируйте проект (или загрузите через FTP)
git clone https://github.com/ваш-username/messenger.git .

# Или загрузите через SCP с вашего компьютера:
# scp -r C:\Users\Miron\OneDrive\Рабочий\ стол\проект root@ваш-ip:/var/www/messenger
```

### Шаг 7: Настройка бэкенда

```bash
cd /var/www/messenger/server

# Установите зависимости
npm install

# Создайте .env файл
nano .env
```

Вставьте:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://messenger_user:ваш_пароль@localhost:5432/messenger"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="ваш-секретный-ключ-минимум-32-символа-123456789"
JWT_REFRESH_SECRET="другой-секретный-ключ-минимум-32-символа-987654321"
CLIENT_URL="http://ваш-ip-адрес"
```

```bash
# Запустите миграции Prisma
npx prisma generate
npx prisma db push

# Запустите сервер через PM2
pm2 start index.js --name messenger-server
pm2 save
pm2 startup
```

### Шаг 8: Настройка фронтенда

```bash
cd /var/www/messenger/client

# Создайте .env файл
nano .env
```

Вставьте:
```env
VITE_API_URL=http://ваш-ip-адрес:3001
VITE_WS_URL=ws://ваш-ip-адрес:3001
```

```bash
# Установите зависимости и соберите
npm install
npm run build
```

### Шаг 9: Настройка Nginx

```bash
nano /etc/nginx/sites-available/messenger
```

Вставьте:
```nginx
server {
    listen 80;
    server_name ваш-ip-адрес;

    # Фронтенд
    location / {
        root /var/www/messenger/client/dist;
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
        proxy_set_header Host $host;
    }
}
```

```bash
# Активируйте конфигурацию
ln -s /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Шаг 10: Настройка файрвола

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 🌐 Подключение домена .RU

### Вариант 1: REG.RU

1. Купите домен на [reg.ru](https://www.reg.ru) (~200-500₽/год)
2. В панели управления доменом настройте DNS:
   ```
   A-запись: @ → ваш-ip-адрес
   A-запись: www → ваш-ip-адрес
   ```

### Вариант 2: Timeweb

1. Купите домен прямо в Timeweb (~300₽/год)
2. DNS настроится автоматически

### Настройка SSL (HTTPS)

```bash
# Установите Certbot
apt install -y certbot python3-certbot-nginx

# Получите SSL сертификат
certbot --nginx -d ваш-домен.ru -d www.ваш-домен.ru

# Автообновление сертификата
certbot renew --dry-run
```

Обновите `.env` файлы:
```env
# server/.env
CLIENT_URL="https://ваш-домен.ru"

# client/.env
VITE_API_URL=https://ваш-домен.ru
VITE_WS_URL=wss://ваш-домен.ru
```

Пересоберите фронтенд:
```bash
cd /var/www/messenger/client
npm run build
pm2 restart messenger-server
```

---

## 💰 Стоимость

### Минимальная конфигурация:
- **VPS Timeweb**: 169₽/месяц
- **Домен .RU**: 200₽/год
- **SSL**: Бесплатно (Let's Encrypt)
- **Итого**: ~190₽/месяц

### Рекомендуемая конфигурация:
- **VPS (4GB RAM)**: 339₽/месяц
- **Домен**: 200₽/год
- **Итого**: ~360₽/месяц

---

## 🔧 Полезные команды

```bash
# Просмотр логов
pm2 logs messenger-server

# Перезапуск сервера
pm2 restart messenger-server

# Обновление кода
cd /var/www/messenger
git pull
cd server && npm install
cd ../client && npm install && npm run build
pm2 restart messenger-server
```

---

## 📱 Альтернатива: Локальная сеть

Если нужен доступ только в локальной сети (колледж):

1. Запустите на компьютере в колледже
2. Узнайте локальный IP: `ipconfig` (Windows) или `ip a` (Linux)
3. Откройте порты в файрволе
4. Доступ по адресу: `http://192.168.x.x:5173`

---

## 🆘 Поддержка

**Timeweb**: support@timeweb.ru, онлайн-чат  
**Telegram**: @timeweb_support  
**Телефон**: 8 (800) 700-06-08 (бесплатно по РФ)

**Готово! Ваш мессенджер работает на российском хостинге! 🎉**
