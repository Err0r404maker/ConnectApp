import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

// Безопасная CORS политика
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Сервер работает!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err.message);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, (err) => {
  if (err) {
    console.error(`❌ Ошибка запуска сервера:`, err.message);
    process.exit(1);
  }
  console.log(`🚀 Тестовый сервер запущен на http://localhost:${PORT}`);
});