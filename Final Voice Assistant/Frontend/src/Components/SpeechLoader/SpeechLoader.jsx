import React from 'react';
import './SpeechLoader.css'; // Import the separate CSS file

const SpeechLoader = () => {
  return (
    <div className="loader-wrapper">
      <div className="center_div">
        {[...Array(10)].map((_, index) => (
          <div key={index} className="wave" />
        ))}
      </div>
    </div>
  );
}

export default SpeechLoader;
