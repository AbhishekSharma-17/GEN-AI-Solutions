import React, { useState } from 'react';
import './HomePageNavbar.css';
import assets from "../../assets/assets";

const HomePageNavbar = () => {
  const [activePara, setActivePara] = useState('Get Started');

  return (
    <div className='homePage-navbar'>
      <div className="navbar-left">
        <img src= {assets.icon} alt="" />
        <a href=""><img src={assets.genAILogo} alt="" /></a>
      </div>
      <div className="navbar-right">
        <p onClick={() => setActivePara('Documentation')} className={activePara === 'Documentation' ? 'active' : ''}>Documentation</p>
        <a href="https://www.genaiprotos.com#contact-us" target='blank'><p onClick={() => setActivePara('Support')} className={activePara === 'Support' ? 'active' : ''}>Support</p></a>
        <p onClick={() => setActivePara('Get Started')} className={activePara === 'Get Started' ? 'active' : ''}>Get started</p>
      </div>
    </div>
  );
}

export default HomePageNavbar;