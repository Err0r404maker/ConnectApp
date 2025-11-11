import React from 'react';

const TestTailwind: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Тест Tailwind CSS
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Карточка 1 */}
          <div className="glass-primary rounded-3xl p-6 hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Быстрая работа</h3>
            <p className="text-gray-600">Оптимизированная производительность</p>
          </div>

          {/* Карточка 2 */}
          <div className="glass-secondary rounded-3xl p-6 hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Безопасность</h3>
            <p className="text-gray-600">Защищенные соединения</p>
          </div>

          {/* Карточка 3 */}
          <div className="glass-primary rounded-3xl p-6 hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Удобство</h3>
            <p className="text-gray-600">Интуитивный интерфейс</p>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="btn-primary">
            Основная кнопка
          </button>
          <button className="btn-secondary">
            Вторичная кнопка
          </button>
          <button className="btn-ghost">
            Прозрачная кнопка
          </button>
        </div>

        {/* Сообщения */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="flex justify-end">
            <div className="message-sent">
              Это отправленное сообщение с красивым градиентом!
            </div>
          </div>
          <div className="flex justify-start">
            <div className="message-received">
              А это полученное сообщение с элегантным дизайном.
            </div>
          </div>
        </div>

        {/* Форма */}
        <div className="max-w-md mx-auto glass-primary rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Тестовая форма</h2>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Введите текст..." 
              className="input-elegant"
            />
            <input 
              type="email" 
              placeholder="Email адрес..." 
              className="input-elegant"
            />
            <button className="btn-primary w-full">
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTailwind;
