import fetch from 'node-fetch';

async function testDemoLogin() {
  try {
    console.log('🔐 Попытка входа demo@demo.com...');
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@demo.com',
        password: 'demo123'
      })
    });
    
    console.log('Статус:', response.status);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Вход успешен!');
      console.log('Пользователь:', data.user.email);
    } else {
      console.log('❌ Ошибка:', data.error);
    }
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testDemoLogin();
