import React, { useContext } from "react";
import "./App.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import ChatDocuments from "./Pages/Chat With Any/ChatDocuments";
import HomePage from "./Pages/HomePage/HomePage";
import MainPage from "./Pages/MainPage/MainPage";
import { Context } from "./Context/Context";
import { ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const {
    isLLMConfigured,
    setIsLLMConfigured,
    isCardClicked,
    setIsCardClicked,
  } = useContext(Context);

  return (
    <>
      <div className="main-app">
        {/* {currentView === "HomePage" && <HomePage onCardClick={handleCardClick} />}
      {currentView === "MainPage" && <MainPage />}
      {currentView === "ChatDocuments" && <ChatDocuments onBack={handleBackNavigation} />} */}

        {!isLLMConfigured ? (
          <HomePage />
        ) : isCardClicked ? (
          <MainPage />
        ) : (
          <ChatDocuments />
        )}
      </div>
      <ToastContainer />
    </>
  );
};

export default App;
