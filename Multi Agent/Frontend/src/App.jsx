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
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NotFound from "./Page/Not Found/NotFound";


const App = () => {
  const { isAdminLoggedIn, displayAgentCreation, navigateToMain } =
    useContext(AdminContext);
    // let isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn");
  return (
    <BrowserRouter>
    <div className="main-app">
      {/* {!isAdminLoggedIn ? <Admin /> : <Main />} */}
      <Routes>
        {!isAdminLoggedIn ?
        <Route path='/' element={<Admin />}/>:
        <Route path='/*' element={<Main />}/>}
        <Route path="*" element={<NotFound />}/>
      </Routes>

      <ToastContainer />
    </div>
    </BrowserRouter>
  );
};

export default App;
