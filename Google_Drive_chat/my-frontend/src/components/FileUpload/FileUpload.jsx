import React, { useState, useRef } from 'react';
import { MdOutlineFileUpload } from "react-icons/md";
import './FileUpload.css';
import { useDispatch } from 'react-redux';
import jsonFileIcon from '../../assets/jsonFileIcon.png';
import Loader from '../commonComponents/Loader/Loader';
import { setShowDriveFiles } from '../../store/driveSlice';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [inputKey, setInputKey] = useState(Date.now()); // Unique key for input reset
  const fileInputRef = useRef(null);
  const fileUploadRef = useRef(null);
  const dispatch = useDispatch();

  const handleBrowse = (event) => {
    console.log('handleBrowse triggered', event);
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      console.log('Selected file:', selectedFile.name);
      if (selectedFile.type === 'application/json') {
        setFile(selectedFile);
        handleUpload(selectedFile);
      } else {
        alert('Please upload a JSON file.');
        setFile(null); // Reset file state if invalid
        setUploadStatus(''); // Clear status on invalid file
      }
    } else {
      console.log('No file selected');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
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
    event.stopPropagation();
    fileUploadRef.current.classList.add('dragover');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    fileUploadRef.current.classList.remove('dragover');
  };

  const handleUpload = async (selectedFile) => {
    console.log('handleUpload triggered with file:', selectedFile.name);
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
    dispatch(setShowDriveFiles(true));
  };

  const handleReselectFile = () => {
    console.log('Reselecting file...');
    setFile(null); // Clear the file state
    setUploadStatus(''); // Clear the upload status
    setInputKey(Date.now()); // Update key to force new input instance
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input value
      // Delay the click to ensure the new input is rendered
      setTimeout(() => {
        fileInputRef.current.click();
      }, 0);
    }
  };

  return (
    <div className='fileUpload-container'>
      <div className="greet" style={{ fontFamily: "Inter" }}>
        <p className="greetPara2">
          Drive Chatbot
        </p>
      </div>
      <div 
        className={`file-upload ${uploadStatus.includes('Error') ? 'error-border' : ''}`}
        ref={fileUploadRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          key={inputKey} // Force re-render with a new key
          type="file"
          onChange={handleBrowse}
          accept=".json"
          ref={fileInputRef}
          hidden
        />
        <div className="upload-section">
          {file && (
            <div 
              className="file-name"
              onClick={handleReselectFile}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={jsonFileIcon}
                alt="JSON File Icon"
                className="ppt_file_icon"
                width="30px"
              />
              <p className="fw-bold">{file.name}</p>
            </div>
          )}
          {uploadStatus === 'Uploading...' ? (
            <Loader />
          ) : (
            <>
              {!file ? (
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="file-upload-div"
                >
                  <MdOutlineFileUpload
                    className="file-upload-icon-style"
                  />
                  <p className="file-icon-upload-text">
                    Drag and drop your JSON file here - or click to select.
                  </p>
                </div>
              ) : (
                <>
                  {uploadStatus && (
                    <p className={`upload-status ${uploadStatus.includes('Error') ? 'error' : 'success'}`}>
                      {uploadStatus}
                    </p>
                  )}
                  {uploadStatus.includes('successfully uploaded') && (
                    <button
                      onClick={handleConnect}
                      className="btn continue-button-upload"
                      style={{ marginTop: '10px' }}
                    >
                      Connect
                    </button>
                  )}
                  {uploadStatus.includes('Error') && (
                    <button
                      onClick={handleReselectFile}
                      className="btn btn-secondary"
                      style={{ marginTop: '10px' }}
                    >
                      Try Again
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;