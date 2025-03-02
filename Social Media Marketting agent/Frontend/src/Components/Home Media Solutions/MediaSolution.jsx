import React from "react";
import "./MediaSolution.css";
import { SiSimpleanalytics } from "react-icons/si";
import { FaHashtag } from "react-icons/fa6";
import { LuUpload } from "react-icons/lu";


const MediaSolution = () => {
  return (
    <div className="media-solution">
      <div className="media-solution-content">
        <p>OUR SERVICES</p>
        <h1>Comprehensive Social Media Solutions</h1>
        <div className="solution">
          <div className="card">
          <LuUpload className="icon" style={{color:"red"}}/>
            <p>Uploadify</p>
            <span>
             Take a picture or upload an image or video.
            </span>
          </div>
          <div className="card">
            <FaHashtag className="icon"  style={{color:"grey"}}/>
            <p>AutoHashtag</p>
            <span>
            Instantly get post content recommendations with right hashtags.
            </span>
          </div>
          <div className="card">
            <SiSimpleanalytics className="icon"  style={{color:"orange"}}/>
            <p>ClickPost</p>
            <span>
            With just 1-click, post in all your channels with 1-click
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaSolution;
