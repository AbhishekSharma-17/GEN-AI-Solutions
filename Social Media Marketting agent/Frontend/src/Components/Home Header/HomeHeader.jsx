import React, { useContext, useRef, useState } from "react";
import "./HomeHeader.css";
import assets from "../../assets/assets";
import Home from "../../Pages/Home/Home";
import { HomeContext } from "../../Context/HomeContext";
import { CommonContext } from "../../Context/CommonContext";
import { toast } from "react-toastify";

const HomeHeader = () => {
  const {
    LLMType,
    setLLMType,
    form_LLM_type,
    form_API_Key,
    setAPI_KEY,
    form_Groq_API_Key,
    groq_API_KEY,
    setGroq_API_KEY,
  } = useContext(HomeContext);

  const { setError, isLoadings, setIsLoadings, setIsKeyProvided } = useContext(CommonContext);

  const providers = [
    {
      value: "openai",
      label: "OpenAI",
      img: assets.chatGPTIcon,
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
    const groq_API_KEY = form_Groq_API_Key.current.value;

    // Log all the selected or entered details
    // console.log("Selected LLM Type:", LLM_Type);
    // console.log("Entered API Key:", API_Key);
    // console.log("Entered Groq API Key:", groq_API_KEY);

    // Update states with the input values
    setLLMType(LLM_Type);
    setAPI_KEY(API_Key);
    setGroq_API_KEY(groq_API_KEY);

    // Prepare data for the API request
    const form_data = {
      groq_api_key: groq_API_KEY,
      llm_type: LLM_Type,
      api_key: API_Key,
    };

    console.log(form_data);
    setIsKeyProvided(true);
    toast.success("Configuration Saved");
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
      <div></div>
      <div className="header-main">
        <div className="key-input-section">
          <div className="tex-section">
            <h1>Pocket Social Media Manager
            </h1>
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
            {LLMType !== "Groq" ? (
              <div className="mb-4">
                <label htmlFor="apiKey" className="form-label">
                  {LLMType} API Key
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
            ) : null}

            {/* for groq key  */}
            <div className="mb-4">
              <label htmlFor="unstructuredApiKey" className="form-label">
                Groq API Key
              </label>
              <input
                type="password"
                className="form-control"
                id="unstructured_ apiKey"
                placeholder="API Key"
                ref={form_Groq_API_Key}
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
