import React from "react";
import { assets } from "../../assets/assets";
import { Link } from "react-router-dom";  // Import Link
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="sql-to-pyspark-section">
      <div className="content-container">
        <div className="text-content">
          <h1 style={{fontSize:"3vw", fontWeight:"bold", color:"black"}}>SQL to PySpark <br /> Transformation Made Simple</h1>
          <p style={{fontStyle:"italic"}}>
            Transform your SQL queries into optimized PySpark code instantly.
            Save time and boost performance with our AI-powered conversion
            engine.
          </p>
          <div className="button-group">
            <Link to="/main">  {/* Link to main page */}
              <button className="btn-primary">Get Started</button>
            </Link>
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

export default HeroSection;
