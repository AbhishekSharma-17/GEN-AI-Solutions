import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setShowDriveFiles } from './store/driveSlice';
import FileUpload from './components/FileUpload/FileUpload';
import ListDriveFiles from './components/ListDriveFiles/ListDriveFiles';
import SyncDriveFiles from './components/SyncDriveFiles/SyncDriveFiles';
import EmbedDocuments from './components/EmbedDocuments/EmbedDocuments';
import ChatInterface from './components/ChatInterface/ChatInterface';
import Header from './components/Header/Header';
import { Container } from '@mui/material';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const showDriveFiles = useSelector((state) => state.drive.showDriveFiles);

  useEffect(() => {
    const fileUpload = localStorage.getItem('fileUpload') === 'true';
    dispatch(setShowDriveFiles(fileUpload));
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Container className="container">
        <Header />
        <Routes>
          <Route
            path="/"
            element={
              !showDriveFiles ? (
                <FileUpload />
              ) : (
                <Navigate to="/drive-files" replace />
              )
            }
          />
          {showDriveFiles ? (
            <>
              <Route path="/drive-files" element={<ListDriveFiles />} />
              <Route path="/sync-files" element={<SyncDriveFiles />} />
              <Route path="/embed-documents" element={<EmbedDocuments />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="*" element={<Navigate to="/drive-files" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" replace />} />
          )}
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;