import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import './FileUpload.css';
import { setShowDriveFiles } from '../../store/driveSlice';

// Import the Dropbox logo
import dropboxLogo from '../../assets/dropbox.png'; // Ensure this path is correct

const FileUpload = () => {
  const [apiKey, setApiKey] = useState(''); // State to store the API key
  const dispatch = useDispatch();

  const handleSaveConfiguration = async () => {
    if (!apiKey.trim()) {
      alert('Please enter a valid API key.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/save-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (response.ok) {
        alert('API key saved successfully!');
        localStorage.setItem('apiKeySaved', JSON.stringify(true));
        dispatch(setShowDriveFiles(true));
      } else {
        const errorData = await response.json();
        alert('Error: ' + errorData.detail);
      }
    } catch (err) {
      console.error('Error saving API key:', err);
      alert('Error saving API key.');
    }
  };

  return (
    <div className="fileUpload-container">
      <div className="content-wrapper">
        {/* Left Side: API Key Input Section */}
        <div className="api-key-section">
          {/* Dropbox Logo */}
          <div className="logo-container">
            <img src={dropboxLogo} alt="Dropbox Logo" className="dropbox-logo" />
            <h2 className="dropbox-title">dropbox</h2>
          </div>

          {/* API Key Input */}
          <div className="input-container">
            <label htmlFor="apiKey" className="api-key-label">
              OpenAI Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI Key"
              className="api-key-input"
            />
          </div>

          {/* Save Configuration Button */}
          <button onClick={handleSaveConfiguration} className="save-button">
            Save Configuration
          </button>
        </div>

        {/* Right Side: Informational Card */}
        <div className="info-card">
          <h3 className="info-heading">Connect Your API Keys</h3>
          <p className="info-subheading">
            Securely integrate your Dropbox account with our platform
          </p>
          <h4 className="info-subsection-heading">Why Connect API Keys?</h4>
          <ul className="info-list">
            <li>Enable seamless integration with your Dropbox account</li>
            <li>Automate file sharing and notifications</li>
            <li>Access advanced Dropbox features and customizations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;