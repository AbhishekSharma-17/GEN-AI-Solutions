import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setExtractedData(data.result);
    } catch (error) {
      console.error('Error:', error);
      setExtractedData('Error occurred during extraction');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-3xl">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">Document Data Extractor</h1>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Upload File</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full h-32 border-4 border-dashed hover:bg-gray-100 hover:border-gray-300">
                    <div className="flex flex-col items-center justify-center pt-7">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">
                        {file ? file.name : 'Select a file'}
                      </p>
                    </div>
                    <input type="file" onChange={handleFileChange} className="opacity-0" />
                  </label>
                </div>
                <button type="submit" className="w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                  Extract Data
                </button>
              </form>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Extracted Data</h2>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-64 text-sm">
                {extractedData || 'No data extracted yet'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
