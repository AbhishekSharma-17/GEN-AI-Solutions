import React, { useState } from 'react';
import './HomePageNavbar.css';
import assets from "../../assets/assets";

const HomePageNavbar = () => {
  const [activePara, setActivePara] = useState('Get Started');

  return (
    <div className='homePage-navbar'>
      <div className="navbar-left">
        <img src= {assets.icon} alt="" />
        <a href="https://www.genaiprotos.com/" target='blank'><img src={assets.genAILogo} alt="" /></a>
      </div>
    </div>
  );
}

export default HomePageNavbar;