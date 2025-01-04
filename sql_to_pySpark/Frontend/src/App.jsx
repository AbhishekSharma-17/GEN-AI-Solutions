import React from "react";
import MainPage from "./Pages/MainPage/MainPage";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";
import { ToastContainer } from "react-toastify";
import LandingPage from "./Components/Landing Page/LandingPage";

const App = () => {
  return (
    <div className="main-app">
      <MainPage />
      <ToastContainer
        position="top-right"
        autoClose={3000} // Default auto-close after 3 seconds
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        />
        <LandingPage></LandingPage>
        
    </div>
  );
};

export default App;
