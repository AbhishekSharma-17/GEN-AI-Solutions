/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import './Navbar.css';
import genAILogo from '../../assets/genAIWhite.png';
import genAIIcon from '../../assets/icon.png';
import Alert from '@mui/material/Alert';
import { FaBars, FaTools, FaFileAlt, FaComments, FaSignOutAlt } from 'react-icons/fa';
import { setShowAlert, setMessage } from '../../store/connectSlice';

const Navbar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState({ open: false, severity: 'info', message: '' });
  const [detailedAlert, setDetailedAlert] = useState({ open: false, severity: 'info', message: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();

  const handleRedirect = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  };

  const isActive = (path) => location.pathname === path;

  const handleDisconnect = async () => {
    localStorage.removeItem('isOpenAiKeySet');
    localStorage.removeItem('openAiKey');
    
    setAlert({ 
      open: true, 
      severity: 'success', 
      message: 'Successfully disconnected' 
    });
    
    // Navigate to root path after a short delay to show the alert
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const menuItems = [
    { name: 'Tools', path: '/tools', icon: FaTools },
    { name: 'Chat', path: '/chat', icon: FaComments },
  ];
  const nonUplodMenuItems = [];

  // Filter menu items based on fileUpload in localStorage
  const showDriveFiles = localStorage.getItem('isOpenAiKeySet') === 'true';
  
  const visibleMenuItems = showDriveFiles 
    ? menuItems 
    : nonUplodMenuItems;
  const handleToggle = () => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen((prev) => !prev);
      if (isMobileMenuOpen) {
        setIsCollapsed(true);
      }
    } else {
      setIsCollapsed((prev) => {
        console.log('Toggling isCollapsed from', prev, 'to', !prev);
        return !prev;
      });
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
        <p className="menu-title">Slack Agent</p>
      <div className="menu-sidebar-content">
        <div className="menu-container">
          {visibleMenuItems.map((item) => (
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
        {showDriveFiles && (
          <div className="disconnect-container">
            <button className="header-button disconnect-button" onClick={handleDisconnect}>
              <span className="button-text">Disconnect</span>
              <FaSignOutAlt className="button-icon" />
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Initial Alert */}
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
          width: '50%',
          zIndex: 1000,
        }}
      >
        {alert.message}
      </Alert>
    )}

    {/* Detailed Alert */}
    {detailedAlert.open && (
      <Alert
        variant="filled"
        severity={detailedAlert.severity}
        onClose={() => setDetailedAlert({ ...detailedAlert, open: false })}
        sx={{
          position: 'fixed',
          top: 130, // Position below the initial alert
          left: '50%',
          transform: 'translateX(-50%)',
          width: { xs: '90%', sm: '70%', md: '50%' },
          zIndex: 1000,
        }}
      >
        {detailedAlert.message}
      </Alert>
    )}
  </>
  );
};

export default Navbar;