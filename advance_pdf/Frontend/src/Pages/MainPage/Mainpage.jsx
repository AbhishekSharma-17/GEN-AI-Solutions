import React from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import PDFReview from "../../Components/PDF Review/PDFReview";
import Upload from "../../Components/Upload/Upload";
import HomePageNavbar from "../../Components/Homepage Navbar/HomePageNavbar";
import Chat from "../../Components/Chat/Chat";
import { useContext } from "react";
import { Context } from "../../Context/Context";
import './Mainpage.css'

const Mainpage = () => {
  const { embededComplete, fileResponse } = useContext(Context);

  return (
    <div className="main-app">
      {/* Navbar */}
      <div className="navbars">

      <HomePageNavbar />
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Sidebar */}
        <div className="sidebar">
          <Sidebar />
        </div>

        {/* Upload and Review Section */}
        <div className="upload">
          {!embededComplete ? (
            <Upload /> // Show PDFReview if a file is uploaded
          ) : (
            <PDFReview /> // Show Upload component if no file is uploaded
          )}
          {/* <Upload></Upload> */}
        </div>

        {/* Chat Section */}

        <div className="chat">
          <Chat />
        </div>
      </div>
    </div>
  );
};

export default Mainpage;
