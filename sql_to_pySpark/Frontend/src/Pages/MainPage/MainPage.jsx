import React from "react";
import Navbar from "../../Components/Navbar/Navbar";
import "./MainPage.css";
import FileUpload from "../../Components/File Upload/FileUpload";

const MainPage = () => {
  return (
    <div>
      <Navbar />
      <div className="main-container">
        <FileUpload />
      </div>
    </div>
  );
};

export default MainPage;
