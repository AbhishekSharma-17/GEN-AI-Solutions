import React from "react";
import "./MediaSolution.css";
import { SiSimpleanalytics } from "react-icons/si";
import { FaPencil } from "react-icons/fa6";
import { GrAnnounce } from "react-icons/gr";


const MediaSolution = () => {
  return (
    <div className="media-solution">
      <div className="media-solution-content">
        <p>OUR SERVICES</p>
        <h1>Comprehensive Social Media Solutions</h1>
        <div className="solution">
          <div className="card">
          <GrAnnounce className="icon" style={{color:"red"}}/>
            <p>Content Creation</p>
            <span>
              Engaging content that resonates with your target audience and
              drives meaningful interations.
            </span>
          </div>
          <div className="card">
            <FaPencil className="icon"  style={{color:"grey"}}/>
            <p>Compaign Management</p>
            <span>
              Strategic planning and execution of social Media compaign across
              all platform.
            </span>
          </div>
          <div className="card">
            <SiSimpleanalytics className="icon"  style={{color:"orange"}}/>
            <p>Analytics and Reporting</p>
            <span>
              Detailed insights and performance metrics to optimize you social
              media strategy.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaSolution;
