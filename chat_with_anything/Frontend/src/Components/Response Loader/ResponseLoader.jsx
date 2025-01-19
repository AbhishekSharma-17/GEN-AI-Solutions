import React from "react";
import "./ResponseLoader.css";

const ResponseLoader = () => {
  const loadingText = "Loading...";

  return (
    <section className="dots-container">
      <div className="dot" />
      <div className="dot" />
      <div className="dot" />
      <div className="dot" />
      <div className="dot" />
    </section>
  );
};

export default ResponseLoader;
