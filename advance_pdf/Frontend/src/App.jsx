import React, { useContext } from "react";
import "./App.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Context } from "./Context/Context";
import HomePage from "./Pages/HomePage/HomePage";
import { ToastContainer } from "react-toastify";
import Mainpage from "./Pages/MainPage/Mainpage";

const App = () => {
  const { initialisationStatus } = useContext(Context);

  return (
    <>
      {initialisationStatus ? <Mainpage></Mainpage> : <HomePage></HomePage>}

      <ToastContainer />
    </>
  );
};

export default App;
