import React from "react";
import "./ThreeDotsLoader.css";

const ThreeDotsLoader = ({ dotCount }) => {
  const loadingText = "Loading...";

  return (
    <section className="dots-container">
      {Array.from({ length: dotCount }).map((_, index) => (
        <div key={index} className="dot" />
      ))}
    </section>
  );
};

export default ThreeDotsLoader;
