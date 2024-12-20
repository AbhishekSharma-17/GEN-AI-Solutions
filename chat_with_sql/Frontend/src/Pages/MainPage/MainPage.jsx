import React from "react";
import "./MainPage.css";
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
