import React from "react";
import "./HomePage.css";
import HomePageNavbar from "../Homepage Navbar/HomePageNavbar";
import HomePageContainer from "../HomePage Container/HomePageContainer";
import KeyFeatures from "../KeyFeatures/KeyFeatures";

const HomePage = () => {

  // Function to hit the endpoint
  const resetGlobalState = async () => {
    try {
      const response = await fetch("http://localhost:8000/global_reset", {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Response from server for variable reset:", data.resetVar);

      } else {
        console.error("Failed to reset state:", response.status);
      }
    } catch (error) {
      console.error("Error occurred while resetting state:", error);
    }
  };

  // Call resetGlobalState when the component mounts
  useEffect(() => {
    resetGlobalState();
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div className="homePage-div">
      <HomePageNavbar />
      <HomePageContainer />
      <KeyFeatures />
    </div>
  );
};

export default HomePage;
