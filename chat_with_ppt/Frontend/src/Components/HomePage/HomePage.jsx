import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for routing
import "./HomePage.css";
import assets from "../../assets/assets";

const HomePage = () => {
  const [isLaunching, setIsLaunching] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to handle the rocket launch and display stars
  const handleLaunch = () => {
    setIsLaunching(true);

    // Animation duration to complete (8 seconds for this example)
    setTimeout(() => {
      navigate("/app"); // Navigate to the next page after animation
    }, 8000); // Duration matches animation
  };

  // Function to generate stars on the screen
  const generateStars = () => {
    let count = 50;
    let box = document.querySelector(".box");
    let i = 0;
    while (i < count) {
      let star = document.createElement("div");
      let x = Math.floor(Math.random() * window.innerWidth);
      let duration = Math.random() * 2 + 1; // Random duration for animation
      let h = Math.random() * 100 + 1; // Random height for star
      star.style.left = x + "px";
      star.style.width = "1px";
      star.style.height = h + "px";
      star.style.animationDuration = duration + "s";
      star.classList.add("star");
      box.appendChild(star);
      i++;
    }
  };

  // Run stars generation when the component is mounted
  useEffect(() => {
    if (isLaunching) {
      generateStars(); // Generate stars when launching starts
    }
  }, [isLaunching]);

  return (
    <div className="app-container">
      {!isLaunching ? (
        <div className="form-container">
          <h2>Enter API Keys</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLaunch();
            }}
          >
            <div className="form-group">
              <label htmlFor="openAiKey">OpenAI API Key:</label>
              <input type="Password" id="openAiKey" />
            </div>
            <div className="form-group">
              <label htmlFor="unstructuredKey">Unstructured API Key:</label>
              <input type="Password" id="unstructuredKey" />
            </div>
            <button type="submit" className="submit-button">
              Send
            </button>
          </form>
        </div>
      ) : (
        <div className="box">
          <div className="rocket">
            <img src={assets.Rocket_icon} alt="Rocket" />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
