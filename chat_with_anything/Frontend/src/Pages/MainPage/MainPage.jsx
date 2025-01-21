import React from "react";
import "./MainPage.css";
import Main from "../../Components/Main/Main";
import Sidebar from "../../Components/SideBar/Sidebar";

const MainPage = () => {
  return (
    <div className="main-page-section">
      <Sidebar />
      <Main />
    </div>
  );
};

export default MainPage;
