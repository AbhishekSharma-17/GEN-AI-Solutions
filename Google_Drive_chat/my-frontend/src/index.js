import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ListDriveFiles from './components/ListDriveFiles/ListDriveFiles';
import SyncDriveFiles from './components/SyncDriveFiles/SyncDriveFiles';
import EmbedDocuments from './components/EmbedDocuments/EmbedDocuments';
import ChatInterface from './components/ChatInterface/ChatInterface';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/drive-files" element={<ListDriveFiles />} />
        <Route path="/sync-files" element={<SyncDriveFiles />} />
        <Route path="/embed-documents" element={<EmbedDocuments />} />
        <Route path="/chat" element={<ChatInterface />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);