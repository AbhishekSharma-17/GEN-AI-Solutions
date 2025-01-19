import React from "react";
import "./Loader.css";
import { assets } from "../../assets/assets";

const Loader = () => {
  const loadingText = "Loading...";

  return (
    // <div className="loader" />
    <div className="loader-wrapper">
      {/* Spinning Logo */}

      <div>
        <img
          src={assets.icon}
          alt="GenAI Protos Logo"
          className="spinning-logo"
        />
      </div>

      {/* Loading Animation */}
      <div className="loading-text">
        {loadingText.split("").map((char, index) => (
          <span key={index} style={{ animationDelay: `${index * 0.2}s` }}>
            {char}
          </span>
        ))}
      </div>
    </div>
  );
};
export default Loader;
