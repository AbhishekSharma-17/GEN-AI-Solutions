import React from 'react';
import './StreamingResponse.css';

const StreamingResponse = ({ content }) => {
  if (!content) {
    return (
      <div className="streaming-response">
        <p>Waiting for response...</p>
      </div>
    );
  }

  const chunks = content.split('\n');
  const regularContent = [];
  const separateBoxContent = [];

  chunks.forEach((chunk, index) => {
    if (chunk.startsWith('\n') || (index > 0 && chunks[index - 1] === '')) {
      separateBoxContent.push(chunk.trim());
    } else {
      regularContent.push(chunk);
    }
  });

  return (
    <div className="streaming-response">
      <div className="regular-content">
        {regularContent.map((chunk, index) => (
          <p key={index}>{chunk}</p>
        ))}
      </div>
      {separateBoxContent.length > 0 && (
        <div className="separate-box-content">
          {separateBoxContent.map((chunk, index) => (
            <p key={index}>{chunk}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default StreamingResponse;
