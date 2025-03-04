import React, { useState } from 'react';
import { Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './Header.css';
import genAILogo from '../../assets/logo.png'
import Alert from '@mui/material/Alert';
import { setDriveFiles, setShowDriveFiles } from '../../store/driveSlice';

const Header = ({ width }) => {
  const navigate = useNavigate(); 
  const location = useLocation();
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  const dispatch = useDispatch();
  const handleRedirect = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect? This will delete all downloaded files, embeddings, and session data.")) {
      return;
    }
    
    setAlert({ open: true, severity: 'info', message: 'Disconnect is in process' });
    try {
      const response = await fetch("http://localhost:8000/disconnect", {
        credentials: 'include',
      });
      if (response.ok) {
        dispatch(setDriveFiles([]));
        dispatch(setShowDriveFiles(false));
        localStorage.removeItem('fileUpload');
        setAlert({ open: true, severity: 'success', message: 'Disconnected' });
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (err) {
      console.error("Error disconnecting:", err);
      setAlert({ open: true, severity: 'error', message: 'Error disconnecting: ' + err.message });
    }
    setTimeout(() => {
      setAlert({ open: false, severity: 'info', message: '' });
    }, 3000);
  };

  return (
    <div className="header" style={{ width }}>
      <div className='appLogo'>
        <a href="https://www.genaiprotos.com/">
          <img src={genAILogo} alt="genAILogo" />
        </a>
      </div>
      <div className="button-container">
        {localStorage.getItem('fileUpload') && (
          <>
            <button className={`header-button ${isActive('/sync-files') ? 'active' : ''}`} onClick={() => handleRedirect('/sync-files')}>Sync</button>
            <button className={`header-button ${isActive('/embed-documents') ? 'active' : ''}`} onClick={() => handleRedirect('/embed-documents')}>Embed</button>
            <button className={`header-button ${isActive('/chat') ? 'active' : ''}`} onClick={() => handleRedirect('/chat')}>Chat</button>
            <button className="header-button" onClick={handleDisconnect}>Disconnect</button>
          </>
        )}
      </div>
      {alert.open && (
        <Alert 
          variant="filled"
          severity={alert.severity} 
          onClose={() => setAlert({ ...alert, open: false })} 
          sx={{ position: 'fixed', top: 80, left: 16, right: 16, zIndex: 1000 }}
        >
          {alert.message}
        </Alert>
      )}
    </div>
  );
};

export default Header;