import React from "react";
import "./App.css";
import "./index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Title from "./Components/Title/Title";
import DocumentOption from "./Components/DocumentOption/DocumentOption";

const App = () => {
  return <div className="main-app container">
    <Title></Title>
    <DocumentOption></DocumentOption>
  </div>;
};

export default App;
