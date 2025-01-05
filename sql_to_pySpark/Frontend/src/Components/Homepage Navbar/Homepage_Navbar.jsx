import React, { useState } from "react";
import assets from "../../assets/assets";
import "./Homepage_Navbar.css";

const Homepage_Navbar = () => {
  const [activePara, setActivePara] = useState("Home");

  return (
    <div className="LandingPage-navbar">
      <div className="navbar-left">
        <img src={assets.icon} alt="" />
        <a href="#" target="blank">
          <img src={assets.genAILogo} alt="" />
        </a>
      </div>
      <div className="navbar-right">
        {/* home */}
        <a href="#home">
          <p
            onClick={() => setActivePara("Home")}
            className={activePara === "Home" ? "active" : ""}
          >
            Home
          </p>
        </a>

        {/* code */}
        <a href="#homepage-code-convertor">
          <p
            onClick={() => setActivePara("Code")}
            className={activePara === "Code" ? "active" : ""}
          >
            Code Convertor
          </p>
        </a>

        {/* features */}
        <a href="#homepage-features">
          <p
            onClick={() => setActivePara("Features")}
            className={activePara === "Features" ? "active" : ""}
          >
            Features
          </p>
        </a>

        {/* Works */}
        <a href="#work">
          <p
            onClick={() => setActivePara("Works")}
            className={activePara === "Works" ? "active" : ""}
          >
            How It Works
          </p>
        </a>

        {/* contact */}
        <a href="#contact">
          <p
            onClick={() => setActivePara("Contact")}
            className={activePara === "Contact" ? "active" : ""}
          >
            Contact Us
          </p>
        </a>

      </div>
    </div>
  );
};

export default Homepage_Navbar;
