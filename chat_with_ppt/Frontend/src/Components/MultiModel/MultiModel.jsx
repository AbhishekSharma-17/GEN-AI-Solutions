import React, { useState } from "react";
import assets from "../../assets/assets";
import './MultiModel.css';

const MultiModel = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  const model_object = [
    {
      icon: assets.gemini_icon,
      name: "Gemini 1.5 Flash",
    },
    {
      icon: assets.meta_icon,
      name: "Llama 3.1",
    },
    {
      icon: assets.GPT_icon,
      name: "GPT-4O",
    },
    {
      icon: assets.GPT_icon,
      name: "GPT-4O Mini",
    },
    {
      icon: assets.Groq_icon,
      name: "Groq",
    },
  ];

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setIsHovered(false);
  };

  return (
    <div className="model-display">
      <button
        className="select-model-button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {selectedModel ? `Selected: ${selectedModel.name}` : "Select Model"}
      </button>
      {isHovered && (
        <div
          className="drop-up-list"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {model_object.map((model, index) => (
            <div
              key={index}
              className="model-card"
              onClick={() => handleModelSelect(model)}
            >
              <img src={model.icon} alt={model.name} className="model-icon" />
              <p>{model.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiModel;
