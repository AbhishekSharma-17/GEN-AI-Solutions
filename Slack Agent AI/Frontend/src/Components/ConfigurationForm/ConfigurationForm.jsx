/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ConfigurationForm.css";
import slack from "../../assets/slack.png";
import { CircularProgress } from "@mui/material";

const SLACK_CLIENT_ID = import.meta.env.VITE_SLACK_CLIENT_ID
const REDIRECT_URI = "https://8b2e-2401-4900-529d-b384-51f4-3ac6-dd50-e194.ngrok-free.app/slack/oauth/callback"
const ConfigurationForm = () => {
  const [openAiKey, setOpenAiKey] = useState(""); // State to store the OpenAI key
  const [message, setMessage] = useState(""); // State to display success/error messages
  const [isError, setIsError] = useState(false); // State to style the message as success or error
  const [isLoading, setIsLoading] = useState(false); // State to track loading status for Save Configuration
  const [connectLoading, setConnectLoading] = useState(false); // State to track loading status for Connect button
  const [isSuccess, setIsSuccess] = useState(false); // State to track if the API key was saved successfully
  const navigate = useNavigate();

  const handleSaveConfig = async (e) => {
    e.preventDefault();

    // Basic validation: Ensure the key is not empty
    if (!openAiKey.trim()) {
      setMessage("Please enter a valid OpenAI key.");
      setIsError(true);
      return;
    }
    localStorage.setItem('openAiKey', openAiKey);
    localStorage.setItem('isOpenAiKeySet', 'true');
    setIsSuccess(true);
    // Set loading state to true and clear any previous messages
    // setIsLoading(true);
    // setMessage("");

    // try {
    //   // Make the POST request to /set-openai-key
    //   const response = await fetch("http://localhost:8000/set-openai-key", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ api_key: openAiKey }), // Send the key in the request body
    //   });

    //   if (response.ok) {
    //     // On success, set the flag in localStorage

    //     // Display a success message and clear the input field
    //     setMessage("API key saved successfully!");
    //     setIsError(false);
    //     setOpenAiKey(""); // Clear the input field
    //     setIsSuccess(true); // Set success state to show the Connect button
    //   } else {
    //     // On failure, parse the error and display it
    //     const errorData = await response.json();
    //     setMessage(`Error: ${errorData.detail || "Failed to save API key."}`);
    //     setIsError(true);
    //     setIsSuccess(false);
    //   }
    // } catch (err) {
    //   // Handle network or other errors
    //   console.error("Error saving API key:", err);
    //   setMessage("Error: Failed to connect to the server.");
    //   setIsError(true);
    //   setIsSuccess(false);
    // } finally {
    //   // Always set loading state to false after the API call completes
    //   setIsLoading(false);
    // }
  };
 useEffect(() => {
    if (localStorage.getItem('isOpenAiKeySet')) {
      navigate("/chat");
    }
  }, [navigate]);
  useEffect(() => {
    if(localStorage.getItem('openAiKey') && localStorage.getItem('openAiKey').trim() !== '') {
        setIsSuccess(true);
    }
  }, []);

  const handleConnect = () => {
    setConnectLoading(true);
  const slack_oauth_url = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=chat:write,channels:read,groups:read,channels:history,groups:history,channels:join,bookmarks:read,canvases:read,workflows.templates:read,users:read,files:read&redirect_uri=${REDIRECT_URI}`;
  window.location.href = slack_oauth_url;
  };
  console.log('SLACK_CLIENT_ID', SLACK_CLIENT_ID);
  return (
    <div className="homepage-container">
      <div className="container">
        <div className="card">
          {/* Left Section - Form or Success Message */}
          <div className="left-section">
            <div className="slackLogo">
              <img src={slack} alt="Slack" className="api-image" />
              <p className="slackLogoText">Slack</p>
            </div>
            {isSuccess ? (
              <div className="success-container">
                <p className="message success">{message}</p>
                <button
                  className="connect-button"
                  onClick={handleConnect}
                  disabled={connectLoading}
                >
                  {connectLoading ? (
                   <CircularProgress size={24} style={{ color: '#fff' }} />
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>
            ) : (
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
            )}
          </div>

          {/* Right Section - Info */}
          <div className="right-section">
            <h3 className="title">Connect Your API Keys</h3>
            <p className="subtitle">
              Securely integrate your Slack workspace with our platform
            </p>

            <div className="info">
              <h3 style={{ marginLeft: "5px" }} className="title">
                Why Connect API Keys?
              </h3>
              <br />
              <p> Enable seamless integration with your Slack workspace</p>
              <p> Automate notifications and communications</p>
              <p> Access advanced Slack features and customizations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationForm;