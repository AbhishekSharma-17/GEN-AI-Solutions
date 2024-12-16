import React, { useContext, useRef, useState } from "react";
import "./HomePageContainer.css";
import assets from "../../assets/assets";
import { Context } from "../../context/Context";
import { toast } from "react-toastify";
import FancyLoader from "../Loader/FancyLoader";

const HomePageContainer = () => {
  const {
    setAPIProvider,
    setProviderKey,
    setUnstructuredKey,
    setResponseProvider,
    setInitialisationStatus,
  } = useContext(Context);
  const [isLoading, setIsLoading] = useState(false);

  // Create refs for the input fields
  const providerRef = useRef(null);
  const providerKeyRef = useRef(null);
  const unstructuredKeyRef = useRef(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    setIsLoading(true); // Start loading

    // Get values from refs
    const Form_provider = providerRef.current.value;
    const Form_providerKey = providerKeyRef.current.value;
    const Form_unstructuredKey = unstructuredKeyRef.current.value;

    console.log("Form Provider is : ", Form_provider);
    console.log("Form Provider Key is : ", Form_providerKey);
    console.log("Form Unstructured Key is : ", Form_unstructuredKey);

    // Set values in context
    setAPIProvider(Form_provider);
    setProviderKey(Form_providerKey);
    setUnstructuredKey(Form_unstructuredKey);

    // Prepare data to send to the endpoint
    const data = {
      provider: Form_provider,
      api_key: Form_providerKey,
      unstructured_api_key: Form_unstructuredKey,
    };

    try {
      const response = await fetch("http://localhost:8000/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize configuration.");
      }

      const responseData = await response.json();
      console.log("Response from server:", responseData);

      // Check if provider exists in responseData
      if (responseData.provider) {
        console.log("Setting responseProvider to:", responseData.provider);
        setResponseProvider(responseData.provider);
      } else {
        console.error("Provider not found in response data.");
      }

      setInitialisationStatus(true);

      // Show success toast
      toast.success("Configuration saved successfully!");

      // Optionally, you can reset the form fields after submission
      providerRef.current.value = "";
      providerKeyRef.current.value = "";
      unstructuredKeyRef.current.value = "";
    } catch (error) {
      console.error("Error sending data:", error);
      // Show error toast
      toast.error("Failed to save configuration. Please try again.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="homePage-container">
      <div className="homepage-textual-content">
        <div className="homepage-text-content">
          <p>LLM Configuration</p>
          <span>
            Set up your AI environment by providing your API keys. We ensure
            secure handling of your Credentials.
          </span>
        </div>
        <div className="homepage-form-content">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="exampleSelect" className="form-label">
                Select Provider
              </label>
              <select
                className="form-select"
                id="exampleSelect"
                aria-label="Default select example"
                ref={providerRef}
              >
                <option value="" disabled>
                  Select an option
                </option>
                <option value="OpenAI">OpenAI</option>
                <option value="Gemini">Gemini</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="exampleFormControlInput1" className="form-label">
                Provider Key
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Provider Key"
                ref={providerKeyRef}
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="exampleFormControlTextarea1"
                className="form-label"
              >
                Unstructured Key
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="Unstructured Key"
                ref={unstructuredKeyRef}
              />
            </div>
            <div className="mb-4">
              <button
                type="submit"
                className="btn btn-dark"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="me-2">Saving</span>
                    <FancyLoader />
                  </>
                ) : (
                  "Save Configuration"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="homepage-setup-content" style={{ gap: "30px" }}>
        <div className="quick-setup-guide">
          <p>Quick Setup Guide</p>
          <div className="homepage-guide-list">
            <div className="item">
              <p className="serial">1</p>
              <div className="item-description">
                <p className="item-title">Generate API Keys</p>
                <p className="item-def">
                  Visit your AI provider dashboard to generate the required API
                  keys.
                </p>
              </div>
            </div>
            <div className="item">
              <p className="serial">2</p>
              <div className="item-description">
                <p className="item-title">Configure Integration.</p>
                <p className="item-def">
                  Enter both API keys in the configuration form.
                </p>
              </div>
            </div>
            <div className="item">
              <p className="serial">3</p>
              <div className="item-description">
                <p className="item-title">Verify Connection</p>
                <p className="item-def">
                  Check the connection status and start using the integration.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="homepage-setup-image">
          <img src={assets.ai_final} alt="" />
        </div>
      </div>
    </div>
  );
};

export default HomePageContainer;
