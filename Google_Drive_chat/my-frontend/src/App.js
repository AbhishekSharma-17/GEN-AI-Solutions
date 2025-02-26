import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [driveStats, setDriveStats] = useState(null);
  const [syncSummary, setSyncSummary] = useState(null);
  const [embedResult, setEmbedResult] = useState(null);

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

  // Fetch and display the list of Drive files and statistics.
  const handleListFiles = async () => {
    try {
      const response = await fetch("http://localhost:8000/list_drive", {
        credentials: 'include',
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

  // Sync files (download new files).
  const handleSync = async () => {
    try {
      const response = await fetch("http://localhost:8000/sync", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSyncSummary(data);
      } else {
        alert("Error syncing files.");
      }
    } catch (err) {
      console.error("Error syncing files", err);
    }
  };

  // Embed documents.
  const handleEmbed = async () => {
    try {
      const response = await fetch("http://localhost:8000/embed", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEmbedResult(data);
      } else {
        alert("Error embedding documents.");
      }
    } catch (err) {
      console.error("Error embedding documents", err);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>FastAPI Google Drive OAuth Test</h1>

      {/* Upload Section */}
      <div style={{ marginBottom: "40px" }}>
        <h2>Step 1: Upload Client Secret</h2>
        <input type="file" onChange={handleFileChange} accept="application/json" />
        <button onClick={handleUpload} style={{ marginLeft: "10px" }}>Upload</button>
        <p>{uploadMessage}</p>
      </div>

      {/* Connect Section */}
      <div style={{ marginBottom: "40px" }}>
        <h2>Step 2: Connect to Google Drive</h2>
        <p>After uploading the client secret file, click below to connect:</p>
        <button onClick={handleConnect}>Connect</button>
      </div>

      {/* List Drive Files Section */}
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

      {/* Sync Section */}
      <div style={{ marginBottom: "40px" }}>
        <h2>Step 4: Sync New Files</h2>
        <button onClick={handleSync}>Sync Files</button>
        {syncSummary && (
          <div style={{ marginTop: "20px" }}>
            <p><strong>Attempted:</strong> {syncSummary.attempted_count}</p>
            <p><strong>Downloaded:</strong> {syncSummary.downloaded_count}</p>
            <p><strong>Skipped (Existing):</strong> {syncSummary.skipped_existing_count}</p>
            <p><strong>Skipped (Unsupported):</strong> {syncSummary.skipped_unsupported_count}</p>
            <p><strong>Failed:</strong> {syncSummary.failed_count}</p>
            {syncSummary.downloaded_files && syncSummary.downloaded_files.length > 0 && (
              <div>
                <p><strong>Downloaded Files:</strong></p>
                <ul>
                  {syncSummary.downloaded_files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            {syncSummary.skipped_existing_files && syncSummary.skipped_existing_files.length > 0 && (
              <div>
                <p><strong>Skipped (Existing) Files:</strong></p>
                <ul>
                  {syncSummary.skipped_existing_files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            {syncSummary.skipped_unsupported_files && syncSummary.skipped_unsupported_files.length > 0 && (
              <div>
                <p><strong>Skipped (Unsupported) Files:</strong></p>
                <ul>
                  {syncSummary.skipped_unsupported_files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            {syncSummary.failed_files && syncSummary.failed_files.length > 0 && (
              <div>
                <p><strong>Failed Files:</strong></p>
                <ul>
                  {syncSummary.failed_files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embed Section */}
      <div style={{ marginBottom: "40px" }}>
        <h2>Step 5: Embed Documents</h2>
        <button onClick={handleEmbed}>Embed Documents</button>
        {embedResult && (
          <div style={{ marginTop: "20px" }}>
            <p>{embedResult.message}</p>
            {embedResult.failed_count > 0 && (
              <div>
                <p><strong>Files that failed to process:</strong> {embedResult.failed_count}</p>
                <ul>
                  {embedResult.failed_files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
