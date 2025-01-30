import React, { useState } from 'react';
import { FaClipboard, FaDownload, FaCode, FaMarkdown } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

const ResultDisplay = ({ result, isLoading, fileName }) => {
  const [copied, setCopied] = useState(false);
  const [viewRaw, setViewRaw] = useState(false);

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
    let downloadName = 'extracted_content.md';
    if (fileName) {
      const nameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
      downloadName = `${nameWithoutExtension}.md`;
    }
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="result-display bg-white shadow-lg rounded-lg p-6 mt-8">
      <h3 className="text-2xl font-bold mb-4 text-gray-800">Extracted Content</h3>
      <div className="result-container bg-gray-50 border border-gray-200 rounded-md mb-4 overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Content</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewRaw(!viewRaw)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
              title={viewRaw ? "View Formatted" : "View Raw"}
            >
              {viewRaw ? <FaMarkdown /> : <FaCode />}
            </button>
            <button
              onClick={handleCopy}
              disabled={!result || isLoading}
              className={`p-1 rounded transition-colors ${
                copied ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'
              } ${(!result || isLoading) && 'opacity-50 cursor-not-allowed'}`}
              title="Copy to Clipboard"
            >
              <FaClipboard />
            </button>
            <button
              onClick={handleDownload}
              disabled={!result || isLoading}
              className={`p-1 rounded text-gray-400 hover:text-gray-600 transition-colors ${
                (!result || isLoading) && 'opacity-50 cursor-not-allowed'
              }`}
              title="Download as .md"
            >
              <FaDownload />
            </button>
          </div>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : result ? (
            viewRaw ? (
              <pre className="whitespace-pre-wrap break-words text-sm text-gray-700">{result}</pre>
            ) : (
              <ReactMarkdown className="prose max-w-none">{result}</ReactMarkdown>
            )
          ) : (
            <p className="text-gray-500 text-center py-12">No content extracted yet. Upload a file to begin extraction process.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
