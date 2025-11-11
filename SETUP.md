# 🚀 Инструкция по установке

## Требования
- Node.js 18+
- PostgreSQL 14+ или SQLite
- Redis 6+

## Установка

### 1. Клонировать репозиторий
```bash
git clone https://github.com/ВАШ_ЛОГИН/college-messenger.git
cd college-messenger
```

### 2. Установить зависимости
```bash
npm run setup
```

### 3. Настроить окружение
```bash
cp server/.env.example server/.env
```

Отредактируйте `server/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/college_messenger"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
```

### 4. Настроить базу данных
```bash
cd server
npm run db:generate
npm run db:push
cd ..
```

### 5. Запустить проект
```bash
npm run dev
```

Откройте:
- Клиент: http://localhost:5173
- Сервер: http://localhost:3001

## Готово! 🎉
