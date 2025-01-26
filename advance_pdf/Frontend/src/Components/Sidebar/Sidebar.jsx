import React, { useContext } from "react";
import "./Sidebar.css";
import { FaRegFilePdf } from "react-icons/fa6";
import { Context } from "../../Context/Context";

const Sidebar = () => {
  const { file } = useContext(Context);
  return (
    <div className="actual-sidebar">
      <div className="files-list">
        <div>
          <h2>Recent File's</h2>
        </div>
        <div className="files">
          <div className="file">
            <div className="file-icon">
              <FaRegFilePdf style={{ fontSize: "30px", color: "red" }} />
            </div>
            <div className="file-data">
              <p className="file-name">File Name</p>
              <p style={{ fontSize: "15px" }}>Size : 2 mb</p>
            </div>
          </div>
          {/* <div className="file">
                <div className="file-icon">
                <FaRegFilePdf style={{fontSize:"30px", color:"red"}}/>
                </div>
                <div className="file-data">
                    <p className="file-name">File Name</p>
                    <p style={{fontSize:"15px"}}>Size : 2 mb</p>
                </div>
            </div> */}
        </div>
      </div>
      <div className="token-list"></div>
    </div>
  );
};

export default Sidebar;
