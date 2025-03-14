import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './Navbar.css';
import genAILogo from '../../assets/genAIWhite.png';
import genAIIcon from '../../assets/icon.png';
import Alert from '@mui/material/Alert';
import { setDriveFiles, setShowDriveFiles } from '../../store/driveSlice';
import { FaBars, FaSyncAlt, FaFileAlt, FaComments, FaSignOutAlt, FaUpload } from 'react-icons/fa';

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu toggle
  const dispatch = useDispatch();

  const handleRedirect = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
    if (window.innerWidth < 768) {
      setIsCollapsed(true); // Ensure sidebar remains collapsed on mobile after navigation
    }
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

  const menuItems = [
    { name: 'Upload', path: '/', icon: FaUpload },
    { name: 'Sync', path: '/sync-files', icon: FaSyncAlt },
    { name: 'Embed', path: '/embed-documents', icon: FaFileAlt },
    { name: 'Chat', path: '/chat', icon: FaComments },
  ];

  const handleToggle = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen((prev) => !prev); // Toggle mobile menu overlay
      if (isMobileMenuOpen) {
        setIsCollapsed(true); // Reset collapse state when closing mobile menu
      }
    } else {
      setIsCollapsed((prev) => {
        console.log('Toggling isCollapsed from', prev, 'to', !prev);
        return !prev;
      }); // Toggle desktop collapse
    }
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="mobile-header">
        <a href="https://www.genaiprotos.com/" className="mobile-appLogo">
          <img src={genAIIcon} alt="genAIIcon" className="mobile-logo-icon" />
          <img src={genAILogo} alt="genAILogo" className="mobile-logo" />
        </a>
        <button className="mobile-toggle-button" onClick={handleToggle}>
          <FaBars />
        </button>
      </div>

      {/* Sidebar Menu */}
      <div className={`menu-sidebar ${isCollapsed && window.innerWidth >= 768 ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="menu-sidebar-header">
          {window.innerWidth >= 768 && !isCollapsed && (
            <a href="https://www.genaiprotos.com/" className="appLogo">
              <img src={genAIIcon} alt="genAIIcon" className="logo-icon" />
              <img src={genAILogo} alt="genAILogo" className="logo" />
            </a>
          )}
          <button className="toggle-button" onClick={handleToggle}>
            <FaBars />
          </button>
        </div>
        <div className="menu-sidebar-content">
          <div className="menu-container">
            {menuItems.map((item) => (
              <button
                key={item.path}
                className={`header-button ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleRedirect(item.path)}
              >
                <item.icon className="button-icon" />
                <span className="button-text">{item.name}</span>
              </button>
            ))}
          </div>
          {localStorage.getItem('fileUpload') && (
            <div className="disconnect-container">
              <button className="header-button disconnect-button" onClick={handleDisconnect}>
                <span className="button-text">Disconnect</span>
                <FaSignOutAlt className="button-icon" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Alert */}
      {alert.open && (
        <Alert
          variant="filled"
          severity={alert.severity}
          onClose={() => setAlert({ ...alert, open: false })}
          sx={{
            position: 'fixed',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            zIndex: 1000,
          }}
        >
          {alert.message}
        </Alert>
      )}
    </>
  );
};

export default Navbar;