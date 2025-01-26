import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import CommonProvider from "./Context/CommonContext.jsx";
import MainProvider from "./Context/MainContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CommonProvider>
      <MainProvider>

      <App />
      </MainProvider>
    </CommonProvider>
  </StrictMode>
);
