import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../../Navbar/Navbar';
import './Layout.css';
import { useDispatch, useSelector } from 'react-redux';
import { setShowAlert } from '../../../store/connectSlice';
import Alert from '@mui/material/Alert';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNavbarState, setShowNavbarState] = useState(false);
  const location = useLocation();
  const showNavbar = localStorage.getItem('isOpenAiKeySet') === 'true' && location.pathname !== '/upload';
  const showAlert = useSelector((state) => state.connect.showAlert);
  const detailedAlert = useSelector((state) => state.connect.message);
  const dispatch = useDispatch();

  // Automatically close the alert after 5 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        dispatch(setShowAlert(false));
      }, 5000); // 5 seconds

      // Cleanup the timer when the component unmounts or showAlert changes
      return () => clearTimeout(timer);
    }
  }, [showAlert, dispatch]);
  useEffect(() => {
      setShowNavbarState(showNavbar)
  }, [showNavbar, location.pathname]);

  return (
    <div className="layout-container">
      {showAlert && (
        <Alert
          variant="filled"
          severity={detailedAlert.severity}
          onClose={() => dispatch(setShowAlert(false))} // Fixed to close the alert
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
      {showNavbarState && (
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      <div className={`middle-container ${showNavbarState ? (isCollapsed ? 'collapsed' : 'expanded') : 'full-width'}`}>
        <div className="content-container">{children}</div>
      </div>
    </div>
  );
};

export default Layout;