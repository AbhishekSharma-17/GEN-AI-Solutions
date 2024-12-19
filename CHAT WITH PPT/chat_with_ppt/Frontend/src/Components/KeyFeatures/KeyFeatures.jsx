import React from "react";
import "./KeyFeatures.css";
import { FaShieldHalved } from "react-icons/fa6";
import { BsFillLightningChargeFill } from "react-icons/bs";
import { FaArrowTrendUp } from "react-icons/fa6";
import { FaCode } from "react-icons/fa";


const KeyFeatures = () => {
  return (
    <div className="key-features">
      <p className="key-feature-title">Key Features</p>
      <div className="key-feature-list">
        <div className="feature-item">
          <FaShieldHalved className="feature-item-icon"/>
          <p className="feature-item-title">Secure Integration</p>
          <p className="feature-item-desc">
            Enterprise-grade security for your API keys and data processing.
          </p>
        </div>
        <div className="feature-item">
        <BsFillLightningChargeFill className="feature-item-icon" />
          <p className="feature-item-title">Secure Integration</p>
          <p className="feature-item-desc">
            Enterprise-grade security for your API keys and data processing.
          </p>
        </div>
        <div className="feature-item">
        <FaArrowTrendUp className="feature-item-icon"/>

          <p className="feature-item-title">Secure Integration</p>
          <p className="feature-item-desc">
            Enterprise-grade security for your API keys and data processing.
          </p>
        </div>
        <div className="feature-item">
        <FaCode className="feature-item-icon"/>

          <p className="feature-item-title">Secure Integration</p>
          <p className="feature-item-desc">
            Enterprise-grade security for your API keys and data processing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyFeatures;
