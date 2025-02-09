import React from "react";
import "./App.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Admin from "./Page/Admin/Admin";
import User from "./Page/User/User";
import AdminContextProvider from "./Context/AdminContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  return (
    <div className="main-app">
      <AdminContextProvider>
        <Admin></Admin>
      </AdminContextProvider>
      {/* <User></User> */}

      <ToastContainer />
    </div>
  );
};

export default App;
