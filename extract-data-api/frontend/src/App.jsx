import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState('');
  const [activeTab, setActiveTab] = useState('text');

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">LOGO</h1>
          <div className="flex space-x-4">
            <button className="text-gray-600 hover:text-gray-900">History</button>
            <button className="text-gray-600 hover:text-gray-900">Settings</button>
            <button className="text-gray-600 hover:text-gray-900">Help</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <div className="w-1/3 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Data Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">File Statistics</h3>
                <p>Total Files: 24</p>
                <p>Processed: 18</p>
                <p>Pending: 6</p>
              </div>
              <div>
                <h3 className="font-medium">File Types</h3>
                <p>PDF (45%)</p>
                <p>DOC (30%)</p>
                <p>TXT (25%)</p>
              </div>
            </div>
          </div>

          <div className="w-2/3 bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Upload File</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full h-32 border-4 border-dashed hover:bg-gray-100 hover:border-gray-300 rounded-lg">
                    <div className="flex flex-col items-center justify-center pt-7">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">
                        {file ? file.name : 'Drag and drop or click to select files'}
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
              <h2 className="text-lg font-semibold mb-4">Extracted Content</h2>
              <div className="mb-4">
                <button
                  className={`px-4 py-2 rounded-l-md ${activeTab === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setActiveTab('text')}
                >
                  Text
                </button>
                <button
                  className={`px-4 py-2 rounded-r-md ${activeTab === 'markdown' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setActiveTab('markdown')}
                >
                  Markdown
                </button>
              </div>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-64 text-sm">
                {extractedData || 'No content extracted yet. Upload a file to begin extraction process.'}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
