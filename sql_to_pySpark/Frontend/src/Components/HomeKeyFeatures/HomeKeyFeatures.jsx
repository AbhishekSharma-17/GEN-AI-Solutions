import React from "react";
import "./HomeKeyFeatures.css";

const HomeKeyFeatures = () => {
  return (
    <div className="features-steps-section" id="homepage-features">
      <div className="key-features">
        <h2>Key Features</h2>
        <p>Powerful features to streamline your workflow</p>
        <div className="features-container">
          <div className="feature-card">
            <div className="icon">⚡</div>
            <h3>Instant Code Conversion</h3>
            <p>
              Convert complex SQL queries to optimized PySpark code in
              milliseconds with our advanced AI engine.
            </p>
          </div>
          <div className="feature-card">
            <div className="icon">📈</div>
            <h3>Optimization Suggestions</h3>
            <p>
              Get smart recommendations to improve your code performance and
              efficiency.
            </p>
          </div>
          <div className="feature-card">
            <div className="icon">🧩</div>
            <h3>Enterprise Integration</h3>
            <p>
              Seamlessly integrate with your existing data infrastructure and
              workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeKeyFeatures;
