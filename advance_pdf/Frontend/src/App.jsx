import React from "react";
import "./App.css";
import "./index.css";
import Navbar from "./Components/Navbar/Navbar";
import Sidebar from "./Components/Sidebar/Sidebar";
import Chat from "./Components/Chat/Chat";
import Upload from "./Components/Upload/Upload";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  return (
    <div className="main-app">
      <div>
        <Navbar></Navbar>
      </div>
      <div className="main-content">
        <div className="sidebar">
          <Sidebar></Sidebar>
        </div>
        <div className="upload">
          <Upload></Upload>
        </div>
        <div className="chat">
          <Chat></Chat>
        </div>
      </div>
    </div>
  );
};

export default App;
