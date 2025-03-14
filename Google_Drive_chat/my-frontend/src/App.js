import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setShowDriveFiles } from './store/driveSlice';
import FileUpload from './components/FileUpload/FileUpload';
import ListDriveFiles from './components/ListDriveFiles/ListDriveFiles';
import SyncDriveFiles from './components/SyncDriveFiles/SyncDriveFiles';
import EmbedDocuments from './components/EmbedDocuments/EmbedDocuments';
import ChatInterface from './components/ChatInterface/ChatInterface';
import Layout from './components/commonComponents/Layout/Layout';
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
      <Layout>
        <Routes>
          <Route
            path="/"
            element={<FileUpload showDriveFiles={showDriveFiles} />}
          />
          <Route path="/drive-files" element={<ListDriveFiles />} />
          <Route path="/sync-files" element={<SyncDriveFiles />} />
          <Route path="/embed-documents" element={<EmbedDocuments />} />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="*" element={<Navigate to="/drive-files" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;