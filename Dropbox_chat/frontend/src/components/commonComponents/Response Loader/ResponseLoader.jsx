import React from "react";
import "./ResponseLoader.css";

const ResponseLoader = ({ dotCount }) => {
  const loadingText = "Loading...";

  return (
    <section className="dots-container">
      {Array.from({ length: dotCount }).map((_, index) => (
        <div key={index} className="dot" />
      ))}
    </section>
  );
};

export default ResponseLoader;
