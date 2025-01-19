import React from 'react';

const ResultDisplay = ({ result }) => {
  return (
    <div className="result-display">
      <h3>Converted Content</h3>
      <div className="result-container">
        <pre>{result}</pre>
      </div>
      <button onClick={() => navigator.clipboard.writeText(result)} className="copy-button">
        Copy to Clipboard
      </button>
    </div>
  );
};

export default ResultDisplay;
