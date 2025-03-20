import React, { useState } from "react";
import "./ConfigurationForm.css";
import slack_img from "../../assets/dropbox.png";

const ConfigurationForm = () => {

  const handleSaveConfig = (e) => {
    e.preventDefault();
  };

  return (
    <div className="homepage-container">
      <div className="container">
        <div className="card">
          {/* Left Section - Form */}
          <div className="left-section">
            <div className="dropboxLogo">
            <img src={slack_img} alt="Dropbox" className="api-image" />
            <p className="dropboxLogoText">Dropbox</p>
            </div>
            <form className="form" onSubmit={handleSaveConfig}>
              <label>OpenAI Key</label>
              <input type="password" placeholder="Enter your OpenAI Key" />
              <br />


              <button type="submit" className="btn">
                Save Configuration
              </button>
            </form>
          </div>

          {/* Right Section - Info */}
          <div className="right-section">
            <h3 className="title">Connect Your API Keys</h3>
            <p className="subtitle">
              Securely integrate your Dropbox workspace with our platform
            </p>

            <div className="info">
              <h3 style={{ marginLeft: "5px" }} className="title">Why Connect API Keys?</h3>
              <br />
              <p> Enable seamless integration with your Dropbox workspace</p>
              <p> Automate notifications and communications</p>
              <p> Access advanced Dropbox features and customizations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationForm;
