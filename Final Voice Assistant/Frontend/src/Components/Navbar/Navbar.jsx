import React, { useState } from "react";
import "./Navbar.css";
import assets from "../../assets/assets";

const Navbar = () => {
  const [activePara, setActivePara] = useState("Get Started");

  return (
    <div className="homePage-navbar">
      <div className="navbar-left">
        {/* first div */}
        <div className="first-nav-div">
          <img src={assets.icon} alt="" />
        </div>

        {/* second div */}
        <div className="second-nav-div">
          <a href="https://www.genaiprotos.com/" target="blank">
            <img src={assets.genAILogo} alt="" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
