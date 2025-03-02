import React from 'react';

const FileStatistics = ({ totalFiles, processed, pending }) => {
  return (
    <div className="mb-6">
      <h3 className="font-medium text-lg mb-2">File Statistics</h3>
      <div className="bg-gray-100 p-4 rounded-md">
        <p className="mb-2">Total Files: <span className="font-semibold">{totalFiles}</span></p>
        <p className="mb-2">Processed: <span className="font-semibold text-green-600">{processed}</span></p>
        <p>Pending: <span className="font-semibold text-yellow-600">{pending}</span></p>
      </div>
    </div>
  );
};

export default FileStatistics;
