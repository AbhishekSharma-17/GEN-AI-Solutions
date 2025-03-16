import React, { useState } from "react";
import "./ConfigurationForm.css";

import { assets } from "../../assets/assets"; // Import assets for the image

const ConfigurationForm = () => {
  const [showSlackButton, setShowSlackButton] = useState(false);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setShowSlackButton(true);
  };

  return (
    <div className="homepage-container">
      <div className="container">
        <div className="card">
          {/* Left Section - Form */}
          <div className="left-section">
            <img src={assets.slack_img} alt="Slack" className="api-image" />
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
              Securely integrate your Slack workspace with our platform
            </p>

            <div className="info">
              <h3 style={{ marginLeft: "5px" }}>Why Connect API Keys?</h3>
              <br />
              <p> Enable seamless integration with your Slack workspace</p>
              <p> Automate notifications and communications</p>
              <p> Access advanced Slack features and customizations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationForm;
