import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import styled from 'styled-components';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmailDetailPage from './pages/EmailDetailPage';
import ChatPage from './pages/ChatPage';

// Components
import PrivateRoute from './components/common/PrivateRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <AppContainer>
        <LoadingSpinner fullScreen />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        } />
        
        <Route path="/email/:emailId" element={
          <PrivateRoute>
            <EmailDetailPage />
          </PrivateRoute>
        } />
        
        <Route path="/chat" element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppContainer>
  );
}

export default App;
