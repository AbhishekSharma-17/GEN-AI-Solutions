import React, { useState } from 'react';
import './LandingPage.css';
import assets from "../../assets/assets";
import LandingPageSection from '../LandingPage Section/LandingPageSection';

const LandingPage = () => {
  const [activePara, setActivePara] = useState('Get Started');

  return (
    <div className='LandingPage-navbar'>
      <div className="navbar-left">
        <img src= {assets.icon} alt="" />
        <a href="https://www.genaiprotos.com/" target='blank'><img src={assets.genAILogo} alt="" /></a>
      </div>
      <div className="navbar-right">
        <p onClick={() => setActivePara('Documentation')} className={activePara === 'Documentation' ? 'active' : ''}>Features</p>
        <a href="https://www.genaiprotos.com#contact-us" target='blank'><p onClick={() => setActivePara('Support')} className={activePara === 'Support' ? 'active' : ''}>How It Works</p></a>
        <a href="https://www.genaiprotos.com#contact-us" target='blank'><p onClick={() => setActivePara('Support')} className={activePara === 'Support' ? 'active' : ''}>Pricing</p></a>
        <p onClick={() => setActivePara('Get Started')} className={activePara === 'Get Started' ? 'active' : ''}>Try Free Demo</p>
      </div>
      <LandingPageSection></LandingPageSection>
    </div>

    
      
  );
}

export default LandingPage;