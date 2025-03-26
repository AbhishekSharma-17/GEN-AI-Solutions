import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setShowDriveFiles } from './store/driveSlice';
// import FileUpload from './components/FileUpload/FileUpload';
// import ListDriveFiles from './components/ListDriveFiles/ListDriveFiles';
// import SyncDriveFiles from './components/SyncDriveFiles/SyncDriveFiles';
// import EmbedDocuments from './components/EmbedDocuments/EmbedDocuments';
import ChatInterface from './components/ChatInterface/ChatInterface';
import Layout from './components/commonComponents/Layout/Layout';
import ConfigurationForm from './Components/ConfigurationForm/ConfigurationForm'
import './App.css';

// ProtectedRoute component to handle authentication check
const ProtectedRoute = ({ children }) => {
  const isOpenAiKeySet = localStorage.getItem('isOpenAiKeySet') === 'true';
  
  if (!isOpenAiKeySet) {
    // Redirect to home page if fileUpload is not present or not true
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fileUpload = localStorage.getItem('fileUpload') === 'true';
    dispatch(setShowDriveFiles(fileUpload));
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
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            }
            />
          {/* <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <FileUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drive-files"
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
          /> */}
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;