import React from 'react';
import { pdfIcon, wordIcon, excelIcon } from '../assets/assets';

const FileTypes = ({ types }) => {
  const getIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf': return pdfIcon;
      case 'doc': return wordIcon;
      case 'xls': return excelIcon;
      default: return null;
    }
  };

  return (
    <div className="mb-6">
      <h3 className="font-medium text-lg mb-2">File Types</h3>
      <div className="bg-gray-100 p-4 rounded-md">
        {types.map((type, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <img src={getIcon(type.name)} alt={type.name} className="h-5 w-5" />
            <span>{type.name} ({type.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileTypes;
