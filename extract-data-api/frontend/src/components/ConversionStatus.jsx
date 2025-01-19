import React from 'react';

const ConversionStatus = ({ status }) => {
  return (
    <div className="conversion-status">
      <h3>Conversion Status:</h3>
      <p>{status}</p>
    </div>
  );
};

export default ConversionStatus;
