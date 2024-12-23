import React, { useContext } from "react";
import { Context } from "./Context/Context";
import "./index.css";
import "./App.css";
import HomePage from "./Pages/HomePage/HomePage";
import "bootstrap/dist/css/bootstrap.min.css";
import MainPage from "./Pages/MainPage/MainPage";
import { ToastContainer } from "react-toastify";

const App = () => {
  const { connectedToDB } = useContext(Context);

  return (
    <div className="App">
      {connectedToDB ? <MainPage /> : <HomePage />}
      <ToastContainer />
    </div>
  );
};

export default App;
