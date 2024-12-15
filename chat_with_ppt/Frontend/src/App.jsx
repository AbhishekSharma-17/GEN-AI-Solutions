import React, { useContext } from "react";
import "./App.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Main from "./Components/Main/Main";
import Sidebar from "./Components/SideBar/Sidebar";
import { Context } from "./context/Context";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomePageContainer from "./Components/HomePage Container/HomePageContainer";

const App = () => {
  const { initialisationStatus } = useContext(Context);

  return (
    <>
      {!initialisationStatus ? <HomePageContainer /> : (
        <>
          <Sidebar />
          <Main />
        </>
      )}
      <ToastContainer />
    </>
  );
};

export default App;
