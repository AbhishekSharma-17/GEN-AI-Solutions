import React, { useState } from 'react';
import './App.css';
import { FaHistory, FaCog, FaQuestionCircle } from 'react-icons/fa';
import { pdfIcon, wordIcon, excelIcon, pptIcon, htmlIcon, xmlIcon, zipIcon } from './assets/assets';
import logoImage from './assets/logo.png';
import FileStatistics from './components/FileStatistics';
import FileTypes from './components/FileTypes';
import FileHistory from './components/FileHistory';

function App() {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState('');
  const [activeTab, setActiveTab] = useState('text');

  // Mock data for components
  const fileStats = { totalFiles: 24, processed: 18, pending: 6 };
  const fileTypes = [
    { name: 'PDF', percentage: 45 },
    { name: 'DOC', percentage: 30 },
    { name: 'XLS', percentage: 25 },
  ];
  const fileHistory = [
    { name: 'document1.pdf', status: 'success' },
    { name: 'spreadsheet.xlsx', status: 'success' },
    { name: 'presentation.pptx', status: 'error' },
  ];

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
          <img src={logoImage} alt="Logo" className="h-8 w-auto" />
          <div className="flex space-x-4">
            <button className="text-gray-600 hover:text-gray-900 flex items-center">
              <FaHistory className="h-5 w-5 mr-1" />
              History
            </button>
            <button className="text-gray-600 hover:text-gray-900 flex items-center">
              <FaCog className="h-5 w-5 mr-1" />
              Settings
            </button>
            <button className="text-gray-600 hover:text-gray-900 flex items-center">
              <FaQuestionCircle className="h-5 w-5 mr-1" />
              Help
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <div className="w-1/3 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Data Information</h2>
              <FileStatistics {...fileStats} />
              <FileTypes types={fileTypes} />
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <FileHistory files={fileHistory} />
            </div>
          </div>

          <div className="w-2/3 bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Upload File</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full h-32 border-4 border-dashed hover:bg-gray-100 hover:border-gray-300 rounded-lg">
                    <div className="flex flex-col items-center justify-center pt-7">
                      <div className="flex space-x-2">
                        <img src={pdfIcon} alt="PDF" className="h-8 w-8" />
                        <img src={wordIcon} alt="DOC" className="h-8 w-8" />
                        <img src={excelIcon} alt="XLS" className="h-8 w-8" />
                        <img src={pptIcon} alt="PPT" className="h-8 w-8" />
                        <img src={htmlIcon} alt="HTML" className="h-8 w-8" />
                        <img src={xmlIcon} alt="XML" className="h-8 w-8" />
                        <img src={zipIcon} alt="ZIP" className="h-8 w-8" />
                      </div>
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
