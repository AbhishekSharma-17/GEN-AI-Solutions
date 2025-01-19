import React from 'react';

const ResultDisplay = ({ result }) => {
  return (
    <div className="result-display">
      <h3>Converted Content:</h3>
      <pre>{result}</pre>
    </div>
  );
};

export default ResultDisplay;
