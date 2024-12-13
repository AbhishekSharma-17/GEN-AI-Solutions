import React, { useContext, useState } from "react";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import './Sidebar.css'


const Sidebar = () => {
  const handleExtension = () => {
    setExtended((prevExtended) => {
      console.log("Toggling extended from", prevExtended, "to", !prevExtended);
      return !prevExtended;
    });
  };

  const [extended, setExtended] = useState(true);
  const {previousPrompt, setPreviousPrompt} = useContext(Context)

  return (
    <div className="sidebar">
      <div className="top">
        <img
          onClick={handleExtension}
          className="menu"
          src={assets.menu_icon}
          alt="menu_icon"
        />
        <div className="new-chat" style={{border:"1px solid grey"}}>
          <img src={assets.plus_icon} alt="plus_icon" className="plus-icon" />
          {extended ? <p style={{marginTop:"15px", margin:"0"}}>New Chat</p> : null}
        </div>
        <p className="recent-title">Recents</p>
        {extended ? (
          <div className="recent">
            {previousPrompt.map((item, index) => {
              return (
                <div className="recent-entry" key={index}>
                  <img src={assets.message_icon} alt="" />
                  <p className="">{item.slice(0, 22)}...</p>

                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="bottom">
        {extended ? (
          <p className="sidebar-bottom-para-text" style={{marginTop:"12px"}}>
            <a href="https://www.genaiprotos.com/">GenAI Protos</a>
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Sidebar;
