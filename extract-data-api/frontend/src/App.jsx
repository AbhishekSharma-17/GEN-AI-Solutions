import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ConversionStatus from './components/ConversionStatus';
import ResultDisplay from './components/ResultDisplay';
import './App.css';

function App() {
  const [status, setStatus] = useState('Waiting for file...');
  const [result, setResult] = useState('');

  const handleFileUpload = async (file) => {
    setStatus('Converting...');
    setResult('');

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
      setStatus('Conversion complete');
      setResult(data.result);
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error occurred during conversion');
    }
  };

  return (
    <div className="App">
      <h1>Document to Markdown Converter</h1>
      <FileUpload onFileUpload={handleFileUpload} />
      <ConversionStatus status={status} />
      {result && <ResultDisplay result={result} />}
    </div>
  );
}

export default App;
