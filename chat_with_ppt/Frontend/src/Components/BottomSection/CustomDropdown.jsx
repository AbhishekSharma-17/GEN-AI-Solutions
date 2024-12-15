import React, { useState, useEffect } from "react";
import './CustomDropdown.css';

const CustomDropdown = ({ options, selectedOption, setSelectedOption, provider }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    // Filter options based on provider
    const filtered = options.filter(option => option.provider === provider);
    setFilteredOptions(filtered);

    // Set default model based on provider
    if (provider === 'openai' && (!selectedOption || selectedOption.provider !== 'openai')) {
      const defaultOpenAI = filtered.find(option => option.value === 'gpt-4o-mini') || filtered[0];
      setSelectedOption(defaultOpenAI);
    } else if (provider === 'gemini' && (!selectedOption || selectedOption.provider !== 'gemini')) {
      const defaultGemini = filtered.find(option => option.value === 'gemini-1.5-flash') || filtered[0];
      setSelectedOption(defaultGemini);
    }
  }, [provider, options, selectedOption, setSelectedOption]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
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
