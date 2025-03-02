import React, { useState } from 'react';
import { Typography, Button } from '@mui/material';
import './FileUpload.css';
import fileUploadIcon from '../../assets/fileUpload.png';
import jsonFileIcon from '../../assets/jsonFileIcon.png';
import Header from '../Header/Header';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/json') {
      setFile(droppedFile);
      handleUpload(droppedFile);
    } else {
      alert('Please upload a JSON file.');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleBrowse = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      handleUpload(selectedFile);
    } else {
      alert('Please upload a JSON file.');
    }
  };

  const handleUpload = async (selectedFile) => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/upload-client-secret", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        setUploadStatus("File successfully uploaded.");
      } else {
        const errorData = await response.json();
        setUploadStatus("Error: " + errorData.detail);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("Error uploading file.");
    }
  };

  const handleConnect = () => {
    window.location.href = "http://localhost:8000/connect";
    localStorage.setItem('fileUpload', JSON.stringify(true));
  };

  return (
    <div className="upload-container">
      <Header style={{ width: '100%'}} />
      <div 
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {file ? (
          <>
            <img 
              src={jsonFileIcon} 
              alt="JSON File Icon" 
              className="file-icon"
            />
            <Typography variant="h6" gutterBottom>
              {file.name}
            </Typography>
            {uploadStatus && (
              <Typography variant="body2" className={`upload-status ${uploadStatus.includes('Uploading') ? 'uploading' : uploadStatus.includes('Error') ? 'error' : 'success'}`}>
                {uploadStatus}
              </Typography>
            )}
            {uploadStatus.includes('successfully uploaded') && (
              <Button 
                variant="contained" 
                className="connect-button"
                onClick={handleConnect}
              >
                Connect
              </Button>
            )}
            {uploadStatus.includes('successfully uploaded') && (
              <Typography variant="body2" className="connect-instruction" mt={2}>
                Click on "Connect" button to connect with GDrive
              </Typography>
            )}
          </>
        ) : (
          <>
            <img 
              src={fileUploadIcon}
              alt="Upload Icon"
              className="upload-icon"
            />
            <Typography variant="h6" gutterBottom>
              Drop your Client Secret JSON file,
            </Typography>
            <Typography
              variant="body2"
              className="browse-text"
              component="label"
            >
              Or Browse
              <input
                type="file"
                hidden
                accept=".json"
                onChange={handleBrowse}
              />
            </Typography>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;