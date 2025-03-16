import React from "react";
import "./Loader.css";
import icon from '../../../assets/icon.png'

const Loader = ({loadingText = "Uploading...", showLoadingText}) => {

  return (
    // <div className="loader" />
    <div className="loader-wrapper">
      {/* Spinning Logo */}

      <div>
        <img
          src={icon}
          alt="GenAI Protos Logo"
          className="spinning-logo"
        />
      </div>

      {/* Loading Animation */}
      {showLoadingText && <div className="loading-text">
        {loadingText.split("").map((char, index) => (
          <span key={index} style={{ animationDelay: `${index * 0.2}s` }}>
            {char}
          </span>
        ))}
      </div>}
    </div>
  );
};
export default Loader;