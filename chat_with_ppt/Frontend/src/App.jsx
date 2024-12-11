import React from "react";
import './App.css'
import './index.css'
import Main from "./Components/Main/Main";
import Sidebar from "./Components/Sidebar/Sidebar";
import 'bootstrap/dist/css/bootstrap.min.css'

const App = () => {
  return (
    <>
      <Sidebar></Sidebar>
      <Main></Main>
    </>
  );
};

export default App;