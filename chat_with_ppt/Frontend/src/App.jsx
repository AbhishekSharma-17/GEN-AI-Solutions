import React, { useContext } from "react";
import "./App.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Main from "./Components/Main/Main";
import Sidebar from "./Components/SideBar/Sidebar";
import HomePage from "./Components/HomePage/HomePage";
import { Context } from "./context/Context";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const { initialisationStatus } = useContext(Context);

  return (
    <div className="main-page-section">
      {!initialisationStatus ? <HomePage /> : (
        <>
          <Sidebar />
          <Main />
        </>
      )}
      <ToastContainer />
    </div>
  );
};

export default App;
