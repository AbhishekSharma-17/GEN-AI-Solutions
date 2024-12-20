import React from "react";
import "./MainPage.css";
import Navbar from "../../Components/Navbar/Navbar";
import Sidebar from "../../Components/Sidebar/Sidebar";
import ContentArea from "../../Components/ContentArea/ContentArea";

const MainPage = () => {
  return (
    <div className="main-page">
        <Sidebar />
        <ContentArea />
    </div>
  );
};

export default MainPage;
