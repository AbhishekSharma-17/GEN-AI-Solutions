import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setShowDropboxFiles } from './store/dropboxSlice';
import ConfigurationForm from './components/ConfigurationForm/ConfigurationForm';
import ListDriveFiles from './components/ListDropboxFiles/ListDropboxFiles';
import SyncDriveFiles from './components/SyncDriveFiles/SyncDropboxFiles';
import EmbedDocuments from './components/EmbedDocuments/EmbedDocuments';
import ChatInterface from './components/ChatInterface/ChatInterface';
import Layout from './components/commonComponents/Layout/Layout';
import './App.css';

// ProtectedRoute component to handle authentication check
const ProtectedRoute = ({ children }) => {
  const hasKeyUploaded = localStorage.getItem('isOpenAiKeySet') === 'true';
  
  if (!hasKeyUploaded) {
    // Redirect to home page if isOpenAiKeySet is not present or not true
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch();
  const showDropboxFiles = useSelector((state) => state.dropbox.showDropboxFiles);

  useEffect(() => {
    const isOpenAiKeySet = localStorage.getItem('isOpenAiKeySet') === 'true';
    dispatch(setShowDropboxFiles(isOpenAiKeySet));
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public route - always accessible */}
          <Route
            path="/"
            element={<ConfigurationForm />}
          />
          
          {/* Protected routes */}
          <Route
            path="/dropbox-files"
            element={
              <ProtectedRoute>
                <ListDriveFiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sync-files"
            element={
              <ProtectedRoute>
                <SyncDriveFiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/embed-documents"
            element={
              <ProtectedRoute>
                <EmbedDocuments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            }
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;