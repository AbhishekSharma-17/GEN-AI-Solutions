import React from "react";
import "./Navbar.css";
import assets from "../../assets/assets";

const Navbar = () => {
  return (
    <div className="navbar">
      {/* navbar-icon */}
      <div className="navbar-icon">
        <a href="">
          <img src={assets.genAILogo} alt="" className="genAILogo" />
        </a>
      </div>

      {/* navbar-logo */}
      <div className="navbar-logo">
        <a href="">
          <img src={assets.icon} alt="" className="genAIIcon" />
        </a>
      </div>
    </div>
  );
};

export default Navbar;
