import React, { useContext, useState } from "react";
import "./Upload.css";
import { FiUpload } from "react-icons/fi";
import { Context } from "../../Context/Context"; // Importing context

const Upload = () => {
  const { setFile } = useContext(Context); // Accessing setFile from context
  const [file, setLocalFile] = useState(null);

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    console.log("uploaded file url", uploadedFile);

    if (uploadedFile) {
      setLocalFile(uploadedFile);
      setFile(uploadedFile); // Update context with the uploaded file
    }
  };

  return (
    <div className="actual-upload">
      <div className="prototype-name">
        <p>Chat With PDF</p>
      </div>
      <div className="file-upload">
        <label htmlFor="file-upload-input" className="select-button">
          <FiUpload style={{ fontSize: "50px" }} />
        </label>
        <h3>Upload your PDF</h3>
        <p>Drag and drop your file here, or click to select</p>
        <input
          type="file"
          accept="application/pdf"
          style={{ display: "none" }}
          id="file-upload-input"
          onChange={handleFileChange} // Handle file change
        />
      </div>
    </div>
  );
};

export default Upload;
