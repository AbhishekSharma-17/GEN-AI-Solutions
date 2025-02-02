import React, { useContext, useRef, useState } from "react";
import "./HomeHeader.css";
import assets from "../../assets/assets";
import Home from "../../Pages/Home/Home";
import { HomeContext } from "../../Context/HomeContext";
import { CommonContext } from "../../Context/CommonContext";

const HomeHeader = () => {
  const {
    LLMType,
    setLLMType,
    isLoadings,
    setIsLoadings,
    form_LLM_type,
    form_API_Key,
    setAPI_KEY,
    form_Unstructured_API_Key,
    unstructured_API_KEY,
    setUnstructured_API_KEY,
  } = useContext(HomeContext);

  const { setError } = useContext(CommonContext);

  const providers = [
    {
      value: "openai",
      label: "OpenAI",
      img: assets.chatGPTIcon,
    },
    {
      value: "anthropic",
      label: "Anthropic",
      img: assets.anthropic,
    },
    {
      value: "hugging-face",
      label: "Hugging Face",
      img: assets.hugging_face,
    },
    {
      value: "groq",
      label: "Groq",
      img: assets.groq,
    },
  ];
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoadings(true);
    setError("");

    // Gather data from the form
    const LLM_Type = form_LLM_type.current.textContent || LLMType;
    const API_Key = form_API_Key.current.value;
    const unstructured_API_KEY = form_Unstructured_API_Key.current.value;

    // Log all the selected or entered details
    console.log("Selected LLM Type:", LLM_Type);
    console.log("Entered API Key:", API_Key);
    console.log("Entered Unstructured API Key:", unstructured_API_KEY);

    // Update states with the input values
    setLLMType(LLM_Type);
    setAPI_KEY(API_Key);
    setUnstructured_API_KEY(unstructured_API_KEY);

    // Prepare data for the API request
    const form_data = {
      unstructured_API_Key: unstructured_API_KEY,
      llm_type: LLM_Type,
      api_key: API_Key,
    };

    console.log(form_data);

    // try {
    //   // Send data to the backend
    //   const response = await fetch("http://localhost:8001/connect", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(form_data),
    //   });

    //   if (!response.ok) {
    //     throw new Error("Connection failed. Please check your credentials.");
    //   }

    //   const data = await response.json();
    //   const schemaString = processSchemaString(data.schema);
    //   setDbSchema(schemaString);

    //   if (data) {
    //     setConnectedToDB(true); // Connection successful
    //     toast.success("Database Connected successfully!");
    //   } else {
    //     setError("Failed to connect. Verify the details.");
    //     toast.error("Failed to connect. Verify the details.");
    //   }
    // } catch (err) {
    //   setError(err.message);
    //   setConnectedToDB(false);
    //   setDbSchema("");
    // } finally {
    //   setIsLoadings(false);
    // }
  };

  return (
    <div className="home-header">
      <div className="home-navbar">
        <a href="#">
          <img src={assets.genAILogo} id="logo" alt="Logo" />
        </a>

        <a href="#">
          <img id="icon" src={assets.icon} alt="Icon" />
        </a>
      </div>

      {/* main content */}
      <div>
        
      </div>
      <div className="header-main">
        <div className="key-input-section">
          <div className="tex-section">
            <h1>Transform Your Social Media Presence</h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="exampleSelect" className="form-label">
                Select Provider
              </label>
              <div className="dropdown">
                <button
                  id="customDropdown"
                  className="btn btn-transparent dropdown-toggle w-100"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  ref={form_LLM_type}
                >
                  {LLMType || "Select LLM Type"}
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
                        onClick={() => setLLMType(provider.label)}
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
              <label htmlFor="apiKey" className="form-label">
                API Key
              </label>
              <input
                type="password"
                className="form-control"
                id="apiKey"
                placeholder="API Key"
                ref={form_API_Key}
                required
              />
            </div>
            {/* for uunstructured key  */}
            <div className="mb-4">
              <label htmlFor="unstructuredApiKey" className="form-label">
                Unstructure API Key
              </label>
              <input
                type="password"
                className="form-control"
                id="unstructured_ apiKey"
                placeholder="Unstructured API Key"
                ref={form_Unstructured_API_Key}
                required
              />
            </div>

            <div className="mb-3">
              <button
                type="submit"
                className="btn btn-dark"
                disabled={isLoadings}
              >
                {isLoadings ? "Saving Configuration..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </div>
        <div className="header-image-section">
          <img src={assets.SocialAgent} alt="" />
        </div>
      </div>
    </div>
  );
};

export default HomeHeader;
