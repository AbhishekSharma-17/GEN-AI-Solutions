import React, { useState } from "react";
import "./Navbar.css";

const Navbar = ({ LLMType_modelName, setModelName }) => {
  // State to track the selected model
  const [selectedModel, setSelectedModel] = useState(null);

  const handleModelSelect = (model) => {
    setSelectedModel(model); // Update the selected model
    setModelName(model); // Set the model name in the parent component
  };

  return (
    <div className="main-navbar">
      <p>SQL Assistant</p>

      {/* custom dropdown */}
      <div className="mb-1">
        <div className="dropdown">
          <button
            id="customDropdown"
            className="btn btn-transparent dropdown-toggle w-100"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {/* Display selected model or default text */}
            {selectedModel || "Select LLM Type"}
          </button>
          <ul
            className="dropdown-menu w-100"
            aria-labelledby="dropdownMenuButton"
          >
            {LLMType_modelName.map((model, index) => (
              <li key={index}>
                <button
                  type="button" // Prevents form submission
                  className="dropdown-item d-flex align-items-center"
                  onClick={() => handleModelSelect(model.name)} // Set the selected model
                >
                  <img src={model.image} width={20} height={20}  style={{borderRadius:"10px"}} alt="" />
                  <p style={{fontSize:"15px", fontWeight:"500", marginLeft:"10px" }}>{model.name}</p>
                  
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
