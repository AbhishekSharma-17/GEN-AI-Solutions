import React, { useContext, useRef } from "react";
import "./HomePageContainer.css";
import { assets } from "../../assets/assets";
import { Context } from "../../Context/Context";
// react toatify inclusion
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const HomePageContainer = () => {
  const {
    isLoadings,
    setIsLoadings,
    setDBURI,
    setAPI_KEY,
    setLLMType,
    setConnectedToDB,
    setError,
    connectedToDB,
    setDbSchema,
  } = useContext(Context);

  // Create refs for the input fields
  const form_LLM_type = useRef(null);
  const form_Database_URI = useRef(null);
  const form_API_Key = useRef(null);

  const processSchemaString = (schema) => {
    return schema.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoadings(true);
    setError("");

    // Gather data from the form
    const LLM_Type = form_LLM_type.current.value;
    const Database_URI = form_Database_URI.current.value;
    const API_Key = form_API_Key.current.value;

    // Update states with the input values
    setLLMType(LLM_Type);
    setDBURI(Database_URI);
    setAPI_KEY(API_Key);

    // Prepare data for the API request
    const form_data = {
      db_uri: Database_URI,
      llm_type: LLM_Type,
      api_key: API_Key,
    };

    try {
      // Send data to the backend
      const response = await fetch("http://localhost:8001/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form_data),
      });

      if (!response.ok) {
        throw new Error("Connection failed. Please check your credentials.");
      }

      const data = await response.json();
      const schemaString = processSchemaString(data.schema)
      console.log(schemaString)
      setDbSchema(schemaString);
      // console.log('dbSchema is : ', dbSchema)
      
      if (data) {
        setConnectedToDB(true); // Connection successful
        toast.success("Connected successfully!");
        alert("Connected successfully!", connectedToDB); // Temporary success feedback
        // You can redirect or trigger other success behavior here
      } else {
setError("Failed to connect. Verify the details.");
toast.error("Failed to connect. Verify the details.");
      }
    } catch (err) {
      setError(err.message);
      setConnectedToDB(false);
      setDbSchema("");
    } finally {
      setIsLoadings(false);
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
                ref={form_LLM_type}
                required
              >
                <option value="" disabled>
                  LLM Type
                </option>
                <option value="OpenAI">OpenAI</option>
                <option value="Anthropic">Anthropic</option>
                {/* <option value="AWS">AWS Bedrock</option> */}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="databaseUri" className="form-label">
                Database URI
              </label>
              <input
                type="text"
                className="form-control"
                id="databaseUri"
                placeholder="Database URI"
                ref={form_Database_URI}
                required
              />
            </div>
            <div className="mb-3">
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
            
            <div className="mb-3">
              <button type="submit" className="btn btn-dark" disabled={isLoadings}>
                {isLoadings? 'Saving Configuration...':'Save Configuration'}
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
                <p className="item-title">Configure Integration</p>
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
          <img src={assets.frontPage} alt="Setup" />
        </div>
      </div>
    </div>
  );
};

export default HomePageContainer;
