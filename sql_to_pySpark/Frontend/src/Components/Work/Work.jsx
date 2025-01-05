import React from "react";
import "../HomeKeyFeatures/HomeKeyFeatures.css";
import { FaArrowRightLong } from "react-icons/fa6";

const Work = () => {
  return (
    <div className="features-steps-section2" id="work">
      <div className="how-it-works">
        <h2>How It Works</h2>
        <p>Simple steps to transform your code</p>
        <div className="steps-container" id="stepsContainer">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Input SQL</h3>
            <p>Paste your SQL query into our converter interface.</p>
          </div>
          <div>
            <FaArrowRightLong />
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Advanced Processing</h3>
            <p>Our AI analyzes and optimizes your query.</p>
          </div>

          <div>
            <FaArrowRightLong />
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>PySpark Output</h3>
            <p>Get your optimized PySpark code instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
import "../HomeKeyFeatures/HomeKeyFeatures.css";

export default Work;
