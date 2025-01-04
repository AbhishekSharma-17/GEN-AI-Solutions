import React from "react";
import "./LandingPageSection.css";
import { assets } from "../../assets/assets";

const LandingPageSection = () => {
  return (
    <section className="sql-to-pyspark-section">
      <div className="content-container">
        <div className="text-content">
          <h1>SQL to PySpark Transformation Made Simple</h1>
          <p>
            Transform your SQL queries into optimized PySpark code instantly.
            Save time and boost performance with our AI-powered conversion
            engine.
          </p>
          <div className="button-group">
            <button className="btn-primary">Try Free Demo</button>
            <button className="btn-secondary">Watch Demo</button>
          </div>
        </div>
        <div className="image-content">
          <img
            src={assets.pyspark_img} 
            alt="SQL to PySpark"
          />
        </div>
      </div>
    </section>



  );
};

export default LandingPageSection;
