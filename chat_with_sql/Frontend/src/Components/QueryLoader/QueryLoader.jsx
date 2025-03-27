import React from 'react';
import './QueryLoader.css';
import {assets} from '../../assets/assets';

const QueryLoader = () => {
  const loadingText = "Loading...";

  return (
    <div className="loader-wrapper">
      {/* Spinning Logo */}
      <div className="logo-container">
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

export default QueryLoader;
