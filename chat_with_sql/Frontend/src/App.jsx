import React, { useContext } from "react";
import { Context } from "./Context/Context";
import "./index.css";
import "./App.css";
import HomePage from "./Pages/HomePage/HomePage";
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const { connectedToDB } = useContext(Context);

  return (
    <div className="App">
      {connectedToDB ? <div>Welcome to the Main Page</div> : <HomePage />}
    </div>
  );
};

export default App;
