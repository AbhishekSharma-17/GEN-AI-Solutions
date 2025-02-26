import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [driveStats, setDriveStats] = useState(null);

  // Handle file selection.
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload client_secret.json to the backend.
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

  // Redirect to /connect endpoint for Google OAuth.
  const handleConnect = () => {
    window.location.href = "http://localhost:8000/connect";
  };

  // Fetch and display the list of files and drive stats.
  const handleListFiles = async () => {
    try {
      const response = await fetch("http://localhost:8000/list_drive", {
        credentials: 'include', // Send cookies for session data.
      });
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setDriveStats({
          totalItems: data.total_items,
          foldersCount: data.folders_count,
          filesCount: data.files_count,
        });
      } else {
        setFiles([]);
        setDriveStats(null);
        alert("Error fetching files. Are you connected?");
      }
    } catch (err) {
      console.error("Error fetching files", err);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>FastAPI Google Drive OAuth Test</h1>

      <div style={{ marginBottom: "40px" }}>
        <h2>Step 1: Upload Client Secret</h2>
        <input type="file" onChange={handleFileChange} accept="application/json" />
        <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
          Upload
        </button>
        <p>{uploadMessage}</p>
      </div>

      <div style={{ marginBottom: "40px" }}>
        <h2>Step 2: Connect to Google Drive</h2>
        <p>After uploading the client secret file, click below to connect:</p>
        <button onClick={handleConnect}>Connect</button>
      </div>

      <div style={{ marginBottom: "40px" }}>
        <h2>Step 3: List Drive Files & Statistics</h2>
        <button onClick={handleListFiles}>List Files</button>

        {driveStats && (
          <div style={{ marginTop: "20px" }}>
            <p><strong>Total Items:</strong> {driveStats.totalItems}</p>
            <p><strong>Folders:</strong> {driveStats.foldersCount}</p>
            <p><strong>Files:</strong> {driveStats.filesCount}</p>
          </div>
        )}

        {files.length > 0 && (
          <table border="1" cellPadding="5" cellSpacing="0" style={{ marginTop: "20px" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>MIME Type</th>
                <th>Drive Link</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr key={index}>
                  <td>{file.name}</td>
                  <td>{file.id}</td>
                  <td>{file.mimeType}</td>
                  <td>
                    <a
                      href={file.webViewLink ? file.webViewLink : `https://drive.google.com/file/d/${file.id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
