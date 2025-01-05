import React from "react";
import "./Sidebar.css";
import assets from "../../assets/assets";
import { LuDot } from "react-icons/lu";


const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* sidebar top */}
      <div className="sidebar-top">
        <p id="active-character-title">Active Character's</p>
        <div className="active-character">
          <div className="character">
            <img src={assets.avatar} alt="" />
            <div className="character-status">
                <p id="character-name">John Doe</p>
                <p id="status">
                Active</p>
            </div>
          </div>
          <div className="character">
            <img src={assets.avatar} alt="" />
            <div className="character-status">
                <p id="character-name">John Doe</p>
                <p id="status">
                Active</p>
            </div>
          </div>
          
        </div>
      </div>

      {/* sidebar bottom */}
      <div className="sidebar-bottom"><p>Kroo AI</p></div>
    </div>
  );
};

export default Sidebar;
