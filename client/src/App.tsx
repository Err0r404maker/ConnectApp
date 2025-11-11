import React, { useEffect, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { socketService } from './services/socketService';
import { InstallPWA } from './components/InstallPWA';
import { ThemeTransition } from './components/ThemeTransition';
import { Toaster } from 'react-hot-toast';
import TestStyles from './TestStyles';
import TestTailwind from './TestTailwind';
import './index.css';

// Прямые импорты вместо lazy loading для исправления ошибки
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ImprovedChatPage';



const App = memo(() => {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { isDark } = useThemeStore();

  // Инициализация темы при загрузке
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  useEffect(() => {
    // Не подключаем socket здесь - это делается в ChatPage
  }, [isAuthenticated, accessToken]);

  return (
    <>
      <ThemeTransition />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen">
          <Routes>
            <Route 
              path="/login" 
              element={<LoginPage />} 
            />
            <Route 
              path="/register" 
              element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/chat" replace />} 
            />
            <Route 
              path="/chat" 
              element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" replace />} 
            />

            <Route 
              path="/test" 
              element={<TestStyles />} 
            />
            <Route 
              path="/tailwind" 
              element={<TestTailwind />} 
            />
            <Route 
              path="/" 
              element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} 
            />
          </Routes>
        </div>
        <InstallPWA />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-primary)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'var(--bg-primary)'
              }
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: 'var(--bg-primary)'
              }
            }
          }}
        />
      </Router>
    </>
  );
});

export default App;
