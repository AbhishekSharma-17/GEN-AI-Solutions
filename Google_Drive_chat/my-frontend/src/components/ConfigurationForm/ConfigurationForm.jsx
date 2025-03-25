import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ConfigurationForm.css";
import drive_img from "../../assets/drive-icon.png";
import { CircularProgress } from "@mui/material";

const ConfigurationForm = () => {
  const [openAiKey, setOpenAiKey] = useState(""); // State to store the OpenAI key
  const [message, setMessage] = useState(""); // State to display success/error messages
  const [isError, setIsError] = useState(false); // State to style the message as success or error
  const [isLoading, setIsLoading] = useState(false); // State to track loading status for Save Configuration
  const navigate = useNavigate();

  const handleSaveConfig = async (e) => {
    e.preventDefault();

    // Basic validation: Ensure the key is not empty
    if (!openAiKey.trim()) {
      setMessage("Please enter a valid OpenAI key.");
      setIsError(true);
      return;
    }

    // Set loading state to true and clear any previous messages
    setIsLoading(true);
    setMessage("");

    try {
      // Make the POST request to /set-openai-key
      const response = await fetch("http://localhost:8000/set-openai-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ api_key: openAiKey }), // Send the key in the request body
      });

      if (response.ok) {
        setMessage("API key saved successfully!");
        localStorage.setItem("isOpenAiKeySet", 'true');
        navigate("/upload");
        setIsError(false);
        setOpenAiKey(""); // Clear the input field
      } else {
        // On failure, parse the error and display it
        const errorData = await response.json();
        setMessage(`Error: ${errorData.detail || "Failed to save API key."}`);
        setIsError(true);
      }
    } catch (err) {
      // Handle network or other errors
      console.error("Error saving API key:", err);
      setMessage("Error: Failed to connect to the server.");
      setIsError(true);
    } finally {
      // Always set loading state to false after the API call completes
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (localStorage.getItem('isOpenAiKeySet')) {
      navigate("/upload");
    }
  }, [navigate]);

  return (
    <div className="homepage-container">
      <div className="container">
        <div className="card">
          {/* Left Section - Form or Success Message */}
          <div className="left-section">
            <div className="driveLogo">
              <img src={drive_img} alt="G Drive" className="api-image" />
              <p className="driveLogoText">G Drive</p>
            </div>
              <form className="form" onSubmit={handleSaveConfig}>
                <label>OpenAI Key</label>
                <input
                  type="password"
                  placeholder="Enter your OpenAI Key"
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)} // Update state on input change
                />
                <br />

                <button type="submit" className="btn" disabled={isLoading}>
                  {isLoading ? (
                    <CircularProgress size={24} style={{ color: '#fff' }} />
                  ) : (
                    "Save Configuration"
                  )}
                </button>

                {/* Display error message */}
                {message && (
                  <p className={`message ${isError ? "error" : "success"}`}>
                    {message}
                  </p>
                )}
              </form>
          </div>

          {/* Right Section - Info */}
          <div className="right-section">
            <h3 className="title">Connect Your API Keys</h3>
            <p className="subtitle">
              Securely integrate your Dropbox workspace with our platform
            </p>

            <div className="info">
              <h3 style={{ marginLeft: "5px" }} className="title">
                Why Connect API Keys?
              </h3>
              <br />
              <p> Enable seamless integration with your Dropbox workspace</p>
              <p> Automate notifications and communications</p>
              <p> Access advanced Dropbox features and customizations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationForm;