import React, { useState } from "react";

const CustomDropdown = ({ options, selectedOption, setSelectedOption }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  return (
    <div className="custom-dropdown">
      <div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
        {selectedOption ? (
          <>
            <img src={selectedOption.img} alt="" style={{ width: '20px', marginRight: '8px' }} />
            <span>{selectedOption.label}</span>
          </>
        ) : (
          <span>Please choose a model</span> // Changed text here
        )}
      </div>
      {isOpen && (
        <ul className={`dropdown-list ${isOpen ? 'show' : ''}`}>
          {options.map((option) => (
            <li key={option.value} onClick={() => handleSelect(option)}>
              <img src={option.img} alt="" style={{ width: '20px', marginRight: '8px' }} />
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomDropdown;