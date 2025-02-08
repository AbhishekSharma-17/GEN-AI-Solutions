import React from 'react';
import { FaFile, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const FileHistory = ({ files }) => {
  return (
    <div className="mb-6">
      <h3 className="font-medium text-lg mb-2">File History</h3>
      <div className="bg-gray-100 p-4 rounded-md max-h-64 overflow-y-auto">
        {files.map((file, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2 p-2 bg-white rounded-md">
            <FaFile className="text-gray-500" />
            <span className="flex-grow">{file.name}</span>
            {file.status === 'success' ? (
              <FaCheckCircle className="text-green-500" />
            ) : (
              <FaExclamationCircle className="text-red-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileHistory;
