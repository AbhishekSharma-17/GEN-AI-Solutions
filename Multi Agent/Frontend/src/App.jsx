// import React from "react";
import "./App.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Admin from "./Page/Admin/Admin";
import User from "./Page/Main/Main";
import { AdminContext } from "./Context/AdminContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useContext } from "react";
import Main from "./Page/Main/Main";


const App = () => {
  const { isAdminLoggedIn, displayAgentCreation, navigateToMain } =
    useContext(AdminContext);
  return (
    <div className="main-app">
      {!isAdminLoggedIn ? <Admin /> : <Main />}
      <ToastContainer />
    </div>
  );
};

export default App;
