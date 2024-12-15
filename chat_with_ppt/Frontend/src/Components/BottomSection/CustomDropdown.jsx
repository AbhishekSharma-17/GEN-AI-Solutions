import React, { useState } from "react";
import './CustomDropdown.css';

const CustomDropdown = ({ options, selectedOption, setSelectedOption }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    setSelectedOption(option); // Update the selected option
    setIsOpen(false); // Close the dropdown after selection
  };

  const handleToggle = () => {
    setIsOpen(prev => !prev); // Toggle the dropdown open/close state
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
        {options.map((option) => (
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