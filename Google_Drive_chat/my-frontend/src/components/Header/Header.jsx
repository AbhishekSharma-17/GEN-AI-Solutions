import React, { useState } from 'react';
import { Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import googleChatLogo from '../../assets/googleChatLogo.png';
import Alert from '@mui/material/Alert';

const Header = ({ width }) => {
  const navigate = useNavigate(); 
  const location = useLocation();
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' }); // State for alert

  const handleRedirect = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect? This will delete all downloaded files, embeddings, and session data.")) {
      return;
    }
    
    setAlert({ open: true, severity: 'info', message: 'Disconnect is in process' }); // Show loading alert

    try {
      const response = await fetch("http://localhost:8000/disconnect", {
        credentials: 'include',
      });
      if (response.ok) {
        localStorage.removeItem('fileUpload');
        navigate('/');
        setAlert({ open: true, severity: 'success', message: 'Disconnected' }); // Show success alert
      } else {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (err) {
      console.error("Error disconnecting:", err);
      setAlert({ open: true, severity: 'error', message: 'Error disconnecting: ' + err.message });
    }

    // Automatically hide the alert after 3 seconds (optional)
    setTimeout(() => {
      setAlert({ open: false, severity: 'info', message: '' });
    }, 3000);
  };

  return (
    <div className="header" style={{ width }}>
      <div className='appLogo'>
        <img src={googleChatLogo} alt="Google Chat" className="logo" />
        <Typography variant="h6" className="header-title">Chat</Typography>
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