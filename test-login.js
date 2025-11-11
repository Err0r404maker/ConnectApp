import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('🔍 Проверка сервера...');
    
    // Проверяем доступность сервера
    const healthCheck = await fetch('http://localhost:3001/health');
    console.log('✅ Сервер работает:', healthCheck.status);
    
    // Пробуем войти
    console.log('\n🔐 Попытка входа admin@admin.com...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: '123456'
      })
    });
    
    console.log('Статус ответа:', loginResponse.status);
    const data = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Вход успешен!');
      console.log('Пользователь:', data.user.email);
      console.log('Токен получен:', data.accessToken ? 'Да' : 'Нет');
    } else {
      console.log('❌ Ошибка входа:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Сервер не запущен! Запустите: npm run server:dev');
    }
  }
}

testLogin();
