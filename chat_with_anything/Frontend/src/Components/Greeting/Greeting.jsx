import React, { useContext } from "react";
import "./Greeting.css";
import { Context } from "../../Context/Context";

const Greeting = () => {
  const { uploadSectionTitle } = useContext(Context);
  return (
    <div className="greet" style={{ fontFamily: "Inter" }}>
      <p className="greetPara2">
        <span style={{ fontWeight: "bold" }}>Prototype</span>: {uploadSectionTitle}
      </p>
    </div>
  );
};

export default Greeting;
