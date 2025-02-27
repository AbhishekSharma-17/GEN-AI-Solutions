import React, { useContext } from "react";
import "./App.css";
import "./index.css";
import Home from "./Pages/Home/Home";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Main from "./Pages/Main/Main";
import MainProvider from "./Context/MainContext";
import { CommonContext } from "./Context/CommonContext";

const App = () => {
  const { isKeyProvided } = useContext(CommonContext);
  return (
    <div className="app">
      {isKeyProvided ? <Main></Main> : <Home></Home>}
      <ToastContainer />
    </div>
  );
};

export default App;
