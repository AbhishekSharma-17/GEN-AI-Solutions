// import React from "react";
import "./App.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Admin from "./Page/Admin/Admin";
import User from "./Page/User/User";
import  { AdminContext } from "./Context/AdminContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useContext } from "react";

const App = () => {
  const { isAdminLoggedIn , displayUser} = useContext(AdminContext);
  return (
    <div className="main-app">
      {isAdminLoggedIn && displayUser?<User />:<Admin />}
      <ToastContainer />
    </div>
  );
};

export default App;
