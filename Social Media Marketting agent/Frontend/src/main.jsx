import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import CommonProvider from "./Context/CommonContext.jsx";
import MainProvider from "./Context/MainContext.jsx";
import HomeProvider from "./Context/HomeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CommonProvider>
      <MainProvider>
        <HomeProvider>
          <App />
        </HomeProvider>
      </MainProvider>
    </CommonProvider>
  </StrictMode>
);
