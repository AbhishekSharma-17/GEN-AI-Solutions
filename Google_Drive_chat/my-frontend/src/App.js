import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload/FileUpload';
import { Container } from '@mui/material';
import { useNavigate, Outlet } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const [showDriveFiles, setShowDriveFiles] = useState(false);

  useEffect(() => {
    const fileUpload = localStorage.getItem('fileUpload') === 'true';
    if (fileUpload) {
      navigate('/drive-files');
      setShowDriveFiles(true);
    }
  }, [navigate]);

  return (
    <Container>
      {!showDriveFiles ? (
        <>
          <FileUpload />
        </>
      ) : (
        <Outlet />
      )}
    </Container>
  );
}

export default App;