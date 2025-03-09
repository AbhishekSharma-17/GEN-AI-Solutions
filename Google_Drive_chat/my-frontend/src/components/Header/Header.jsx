import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './Header.css';
import genAILogo from '../../assets/logo.png';
import genAIIcon from '../../assets/icon.png';
import Alert from '@mui/material/Alert';
import { setDriveFiles, setShowDriveFiles } from '../../store/driveSlice';

const Header = ({ width }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useDispatch();

  const handleRedirect = (path) => {
    navigate(path);
    setMenuOpen(false);
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
      <a href="https://www.genaiprotos.com/" className="appLogo">
        <img src={genAIIcon} alt="genAIIcon" className="logo-icon" />
        <img src={genAILogo} alt="genAILogo" className="logo" />
      </a>
      <div className="burger-menu">
        <button
          className="burger-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={menuOpen ? 'burger-line open' : 'burger-line'}></span>
          <span className={menuOpen ? 'burger-line open' : 'burger-line'}></span>
          <span className={menuOpen ? 'burger-line open' : 'burger-line'}></span>
        </button>
      </div>
      <div className={`button-container ${menuOpen ? 'open' : ''}`}>
        {localStorage.getItem('fileUpload') && (
          <>
            <button
              className={`header-button ${isActive('/sync-files') ? 'active' : ''}`}
              onClick={() => handleRedirect('/sync-files')}
            >
              Sync
            </button>
            <button
              className={`header-button ${isActive('/embed-documents') ? 'active' : ''}`}
              onClick={() => handleRedirect('/embed-documents')}
            >
              Embed
            </button>
            <button
              className={`header-button ${isActive('/chat') ? 'active' : ''}`}
              onClick={() => handleRedirect('/chat')}
            >
              Chat
            </button>
            <button className="header-button" onClick={handleDisconnect}>
              Disconnect
            </button>
          </>
        )}
      </div>
      {alert.open && (
        <Alert
          variant="filled"
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{
            position: 'fixed',
            top: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '300px',
            zIndex: 1000,
          }}
        >
          {alert.message}
        </Alert>
      )}
    </div>
  );
};

export default Header;