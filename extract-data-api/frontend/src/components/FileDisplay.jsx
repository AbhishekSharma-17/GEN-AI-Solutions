import React from 'react';

const FileDisplay = ({ file }) => {
  return (
    <div className="file-display bg-white shadow-md rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">Uploaded File</h3>
      {file ? (
        <div className="flex items-center">
          <svg className="w-6 h-6 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-700">{file.name}</span>
        </div>
      ) : (
        <p className="text-gray-500">No file uploaded</p>
      )}
    </div>
  );
};

export default FileDisplay;
