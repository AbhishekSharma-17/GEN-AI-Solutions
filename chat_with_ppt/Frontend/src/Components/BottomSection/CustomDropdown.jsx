import React, { useState, useEffect } from "react";
import './CustomDropdown.css';

const CustomDropdown = ({ options, selectedOption, setSelectedOption, provider }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    // Filter options based on provider
    const filtered = options.filter(option => option.provider === provider);
    setFilteredOptions(filtered);

    // Always set default model based on provider
    let defaultModel;
    if (provider === 'openai') {
      defaultModel = filtered.find(option => option.value === 'gpt-4o-mini') || filtered[0];
    } else if (provider === 'gemini') {
      defaultModel = filtered.find(option => option.value === 'gemini-1.5-flash') || filtered[0];
    }

    // Only update if the selected model doesn't match the current provider
    if (!selectedOption || selectedOption.provider !== provider) {
      setSelectedOption(defaultModel);
    }

    // console.log("Provider changed:", provider);
    // console.log("Selected model:", defaultModel);
  }, [provider, options, setSelectedOption, selectedOption]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    console.log("Model selected:", option);
  };

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className="custom-dropdown">
      <div className="dropdown-header" onClick={handleToggle}>
        {selectedOption ? (
          <>
            <img src={selectedOption.img} alt="" style={{ width: '20px', marginRight: '8px' }} />
            <span>{selectedOption.label}</span>
          </>
        ) : (
          <span>Select a model</span>
        )}
      </div>
      <ul className={`dropdown-list ${isOpen ? 'show' : ''}`}>
        {filteredOptions.map((option) => (
          <li key={option.value} onClick={() => handleSelect(option)}>
            <img src={option.img} alt="" style={{ width: '20px', marginRight: '8px' }} />
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CustomDropdown;
