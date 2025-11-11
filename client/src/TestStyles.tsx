import React from 'react';

const TestStyles: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Тест стилей
          </h1>
          <p className="text-gray-600 mb-6">
            Если вы видите градиентный фон, размытие и красивые тени - стили работают!
          </p>
          <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200">
            Красивая кнопка
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestStyles;
