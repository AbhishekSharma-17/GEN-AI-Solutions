import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload client_secret.json to the backend
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload-client-secret", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setUploadMessage("File uploaded successfully: " + data.file_path);
      } else {
        const errorData = await response.json();
        setUploadMessage("Error: " + errorData.detail);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadMessage("Error uploading file.");
    }
  };

  // Redirect to /connect endpoint for Google OAuth
  const handleConnect = () => {
    window.location.href = "http://localhost:8000/connect";
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>FastAPI Google Drive OAuth Test</h1>

      <div style={{ marginBottom: "40px" }}>
        <h2>Step 1: Upload Client Secret</h2>
        <input
          type="file"
          onChange={handleFileChange}
          accept="application/json"
        />
        <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
          Upload
        </button>
        <p>{uploadMessage}</p>
      </div>

      <div>
        <h2>Step 2: Connect to Google Drive</h2>
        <p>After uploading the client secret file, click below to connect:</p>
        <button onClick={handleConnect}>Connect</button>
      </div>
    </div>
  );
}

export default App;
