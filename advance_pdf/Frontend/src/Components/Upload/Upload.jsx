import React from "react";
import "./Upload.css";
import { FiUpload } from "react-icons/fi";

const Upload = () => {
  return (
    <div className="actual-upload">
      <div className="prototype-name">
        <p>Chat With PDF</p>
      </div>
      <div className="file-upload">{/* upload all icon and text here  */}

          <label htmlFor="file-upload" className="select-button">
            <FiUpload style={{ fontSize: "50px" }} />
          </label>
          <h3>Upload your PDF</h3>
          <p>Drag and drop your file here, or click to select</p>
          <input
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            id="file-upload"
          />

      </div>
    </div>
  );
};

export default Upload;
