import React from "react";
import './App.css'
import './index.css'
import Main from "./Components/Main/Main";
import Sidebar from "./Components/SideBar/Sidebar";
import 'bootstrap/dist/css/bootstrap.min.css'
import Multimodel from "./Components/MultiModel/MultiModel";

const App = () => {
  return (
    <>
      <Sidebar></Sidebar>
      <Multimodel></Multimodel>
      <Main></Main>
    </>
  );
};

export default App;