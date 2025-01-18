import React from "react";
import "./App.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import ChatDocuments from "./Pages/Chat With Any/ChatDocuments";
import HomePage from "./Pages/HomePage/HomePage";
import Main from "./Components/Main/Main";
import MainPage from "./Pages/MainPage/MainPage";

const App = () => {
  return <div className="main-app">
   <ChatDocuments/>
   {/* <HomePage></HomePage> */}
   {/* <MainPage></MainPage> */}
  </div>;
};

export default App;
