import React from "react";
import "./App.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import ChatDocuments from "./Pages/Chat With Any/ChatDocuments";
import HomePage from "./Pages/HomePage/HomePage";

const App = () => {
  return <div className="main-app">
   {/* <ChatDocuments/> */}
   <HomePage></HomePage>
  </div>;
};

export default App;
