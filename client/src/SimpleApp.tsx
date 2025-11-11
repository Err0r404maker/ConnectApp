import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import SimpleLoginPage from './pages/SimpleLoginPage';
import SimpleChatPage from './pages/SimpleChatPage';

const SimpleApp: React.FC = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <SimpleLoginPage /> : <Navigate to="/chat" replace />} 
        />
        <Route 
          path="/chat" 
          element={isAuthenticated ? <SimpleChatPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
};

export default SimpleApp;
