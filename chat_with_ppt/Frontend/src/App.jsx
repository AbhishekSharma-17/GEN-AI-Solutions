import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import './App.css';
import './index.css';
import Main from "./Components/Main/Main";
import Sidebar from "./Components/SideBar/Sidebar";
import 'bootstrap/dist/css/bootstrap.min.css';
// import MultiModel from "./Components/MultiModel/MultiModel";
// import HomePage from "./Components/HomePage/HomePage";

const App = () => {
  return (
   
          <>
            <Sidebar />
            {/* <MultiModel></MultiModel> */}
            <Main />
            
          </>
        
  );
};

export default App;
