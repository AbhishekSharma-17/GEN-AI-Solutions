import React, { useContext } from "react";
import assets from "../../assets/assets";
import "./Sidebar.css";
import { Context } from "../../Context/Context";

const Sidebar = () => {
  const { recentQuery } = useContext(Context);
  return (
    <div className="main-sidebar">
      <div className="main-sidebar-top">
        <p className="sidebar-top-title">Recent Queries</p>
        <div className="queries-list">
          {recentQuery.map((query, index) => (
            <div className="list-item" key={index}>
              <img src={assets.code_icon} alt="" />
              <p>{query.question}</p>
            </div>
          ))}
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
