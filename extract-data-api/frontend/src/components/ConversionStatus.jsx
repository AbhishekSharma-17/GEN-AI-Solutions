import React from 'react';

const ConversionStatus = ({ status }) => {
  return (
    <div className="conversion-status">
      <h3>Conversion Status</h3>
      <div className="status-indicator">
        <span className={`status-dot ${status !== 'Waiting for file...' ? 'active' : ''}`}></span>
        <p>{status}</p>
      </div>
    </div>
  );
};

export default ConversionStatus;
