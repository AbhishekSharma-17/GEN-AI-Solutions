import React, { useState } from 'react';

const ResultDisplay = ({ result, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'extracted_content.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="result-display bg-white shadow-md rounded-lg p-6 mt-8">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">Extracted Content</h3>
      <div className="result-container bg-gray-100 p-4 rounded-md mb-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : result ? (
          <pre className="whitespace-pre-wrap break-words text-sm text-gray-700">{result}</pre>
        ) : (
          <p className="text-gray-500 text-center">No content extracted yet. Upload a file to begin extraction process.</p>
        )}
      </div>
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleCopy}
          disabled={!result || isLoading}
          className={`px-4 py-2 rounded-md text-white font-semibold transition-colors ${
            copied ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
          } ${(!result || isLoading) && 'opacity-50 cursor-not-allowed'}`}
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button
          onClick={handleDownload}
          disabled={!result || isLoading}
          className={`px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-md transition-colors ${
            (!result || isLoading) && 'opacity-50 cursor-not-allowed'
          }`}
        >
          Download as .md
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;
