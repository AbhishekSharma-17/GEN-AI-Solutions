import React, { useState } from 'react';
import Navbar from '../../Navbar/Navbar';
import './Layout.css';

const Layout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Log state changes for debugging
  React.useEffect(() => {
    console.log('Layout isCollapsed state:', isCollapsed);
  }, [isCollapsed]);

  return (
    <div className="layout-container">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`middle-container ${isCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="content-container">{children}</div>
      </div>
    </div>
  );
};

export default Layout;