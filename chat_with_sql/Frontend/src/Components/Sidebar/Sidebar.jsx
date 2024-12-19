import React from "react";
import assets from "../../assets/assets";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <div className="main-sidebar">
      <div className="main-sidebar-top">
        <p className="sidebar-top-title">Recent Queries</p>
        <div className="queries-list">
          <div className="list-item">
            <img src={assets.code_icon} alt="" />
            <p>who has the highest salary? </p>
          </div>
          <div className="list-item">
            <img src={assets.code_icon} alt="" />
            <p>who has the highest salary? </p>
          </div>
          <div className="list-item">
            <img src={assets.code_icon} alt="" />
            <p>who has the highest salary? </p>
          </div>
          <div className="list-item">
            <img src={assets.code_icon} alt="" />
            <p>who has the highest salary? </p>
          </div>
          <div className="list-item">
            <img src={assets.code_icon} alt="" />
            <p>who has the highest salary? </p>
          </div>
          <div className="list-item">
            <img src={assets.code_icon} alt="" />
            <p>who has the highest salary? </p>
          </div>
          <div className="list-item">
            <img src={assets.code_icon} alt="" />
            <p>who has the highest salary? </p>
          </div>
        </div>
      </div>
      <dv className="main-sidebar-bottom">
        <a href="">
          <img src={assets.genAILogo} alt="genAI-protos-logo" />
        </a>
      </dv>
    </div>
  );
};

export default Sidebar;
