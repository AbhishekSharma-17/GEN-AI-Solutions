import React, { useContext, useRef, useState } from "react";
import "./HomePageContainer.css";
import assets from "../../assets/assets";
import { Context } from "../../context/Context";
import { toast } from "react-toastify";
import FancyLoader from "../Loader/FancyLoader";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const HomePageContainer = () => {
  const {
    setAPIProvider,
    setProviderKey,
    setUnstructuredKey,
    setResponseProvider,
    setInitialisationStatus,
    apiProvider,
  } = useContext(Context);

  const [isLoading, setIsLoading] = useState(false);

  // Create refs for input fields
  const providerKeyRef = useRef(null);
  const unstructuredKeyRef = useRef(null);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loading

    // Get values from refs
    const Form_provider = apiProvider; // Taken directly from context
    const Form_providerKey = providerKeyRef.current.value;
    const Form_unstructuredKey = unstructuredKeyRef.current.value;

    // console.log("Form Provider:", Form_provider);
    // console.log("Form Provider Key:", Form_providerKey);
    // console.log("Form Unstructured Key:", Form_unstructuredKey);

    // Set values in context
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

      if (responseData.provider) {
        setResponseProvider(responseData.provider);
      } else {
        console.error("Provider not found in response data.");
      }

      setInitialisationStatus(true);
      toast.success("Configuration saved successfully!");

      // Reset form fields
      providerKeyRef.current.value = "";
      unstructuredKeyRef.current.value = "";
    } catch (error) {
      console.error("Error sending data:", error);
      toast.error("Failed to save configuration. Please try again.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const providers = [
    {
      value: "OpenAI",
      label: "OpenAI",
      img: assets.chatGPTIcon,
    },
    {
      value: "Gemini",
      label: "Gemini",
      img: assets.gemini_icon,
    },
  ];

  return (
    <div style={{ backgroundColor: "rgb(250, 250, 250)", padding: "30px 0px" }}>
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
                <div className="dropdown form-control p-0">
                  <button
                    id="customDropdown"
                    className="btn btn-transparent dropdown-toggle w-100"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {apiProvider || "Select LLM Type"}
                  </button>
                  <ul
                    className="dropdown-menu w-100"
                    aria-labelledby="dropdownMenuButton"
                  >
                    {providers.map((provider) => (
                      <li key={provider.value}>
                        <button
                          type="button"
                          className="dropdown-item d-flex align-items-center"
                          onClick={() => setAPIProvider(provider.label)}
                        >
                          <img
                            src={provider.img}
                            alt={provider.label}
                            className="me-2"
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "10px",
                            }}
                          />
                          {provider.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
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
            <img src={assets.PPT_img} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageContainer;
