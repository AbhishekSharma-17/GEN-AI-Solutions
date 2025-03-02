import React from "react";
import "./App.css";
import 'bootstrap/dist/css/bootstrap.min.css'
import Sidebar from "./Components/Sidebar/Sidebar";
import ContentArea from "./Components/Content/ContentArea";

const App = () => {
  return (
    <div className="app">
      <Sidebar />
      <ContentArea />
    </div>
  );
};

export default App;
