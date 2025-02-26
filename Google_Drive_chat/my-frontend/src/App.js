import React, { useState, useEffect } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [driveStats, setDriveStats] = useState(null);
  const [syncSummary, setSyncSummary] = useState(null);
  const [embedResult, setEmbedResult] = useState(null);
  const [embeddingStatus, setEmbeddingStatus] = useState(null);
  const [disconnectResult, setDisconnectResult] = useState(null);
  
  // Fetch embedding status when component mounts
  useEffect(() => {
    fetchEmbeddingStatus();
  }, []);

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
        // After embedding, refresh the embedding status
        fetchEmbeddingStatus();
      } else {
        alert("Error embedding documents.");
      }
    } catch (err) {
      console.error("Error embedding documents", err);
    }
  };
  
  // Fetch embedding status
  const fetchEmbeddingStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/embedding-status", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setEmbeddingStatus(data);
      } else {
        console.error("Error fetching embedding status");
      }
    } catch (err) {
      console.error("Error fetching embedding status", err);
    }
  };
  
  // Debug file paths and status
  const debugFiles = async () => {
    try {
      const response = await fetch("http://localhost:8000/debug-files", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Debug file info:", data);
        alert("Debug info logged to console. Check browser developer tools.");
      } else {
        console.error("Error fetching debug info");
      }
    } catch (err) {
      console.error("Error fetching debug info", err);
    }
  };
  
  // Handle disconnect - clean up all resources
  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect? This will delete all downloaded files, embeddings, and session data.")) {
      return;
    }
    
    try {
      const response = await fetch("http://localhost:8000/disconnect", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDisconnectResult(data);
        
        // Reset all state variables to reflect disconnected state
        setFiles([]);
        setDriveStats(null);
        setSyncSummary(null);
        setEmbedResult(null);
        setEmbeddingStatus(null);
        setUploadMessage('');
      } else {
        alert("Error disconnecting. See console for details.");
        console.error("Error disconnecting:", await response.text());
      }
    } catch (err) {
      console.error("Error disconnecting", err);
      alert("Error disconnecting: " + err.message);
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
            
            {embedResult.processed_count > 0 && (
              <div>
                <p><strong>Files processed:</strong> {embedResult.processed_count}</p>
                <ul>
                  {embedResult.processed_files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {embedResult.skipped_count > 0 && (
              <div>
                <p><strong>Files skipped (already embedded):</strong> {embedResult.skipped_count}</p>
                <ul>
                  {embedResult.skipped_files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            
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
      
      {/* Embedding Status Section */}
      <div style={{ marginBottom: "40px" }}>
        <h2>Step 6: View Embedding Status</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchEmbeddingStatus}>View Embedding Status</button>
          <button onClick={fetchEmbeddingStatus} title="Refresh status">🔄 Refresh</button>
          <button onClick={debugFiles} style={{ backgroundColor: "#f0ad4e" }}>Debug Files</button>
        </div>
        {embeddingStatus && (
          <div style={{ marginTop: "20px" }}>
            <p>{embeddingStatus.message}</p>
            
            <div style={{ display: "flex", marginBottom: "20px" }}>
              <div style={{ flex: 1, padding: "10px", backgroundColor: "#f0f0f0", margin: "0 10px 0 0", borderRadius: "5px" }}>
                <h3>Summary</h3>
                <p><strong>Total Embedded Files:</strong> {embeddingStatus.total_embedded_files}</p>
                <p><strong>Total Chunks:</strong> {embeddingStatus.total_chunks}</p>
                <p><strong>Files Not Yet Embedded:</strong> {embeddingStatus.not_embedded_count}</p>
              </div>
            </div>
            
            {embeddingStatus.not_embedded_count > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <h3>Files Not Yet Embedded</h3>
                <ul>
                  {embeddingStatus.not_embedded_files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {embeddingStatus.total_embedded_files > 0 && (
              <div>
                <h3>Embedded Files Details</h3>
                <table border="1" cellPadding="5" cellSpacing="0" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Chunks</th>
                      <th>Last Embedded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(embeddingStatus.status).map(([fileName, data], index) => (
                      <tr key={index}>
                        <td>{fileName}</td>
                        <td>{data.chunks}</td>
                        <td>{new Date(data.last_embedded).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Disconnect Section */}
      <div style={{ marginBottom: "40px" }}>
        <h2>Step 7: Disconnect</h2>
        <div>
          <p>Click the button below to disconnect from Google Drive, delete all downloaded files, embeddings, and session data:</p>
          <button
            onClick={handleDisconnect}
            style={{
              backgroundColor: "#dc3545",
              color: "white",
              padding: "10px 15px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Disconnect & Clean Up
          </button>
        </div>
        
        {disconnectResult && (
          <div style={{ marginTop: "20px" }}>
            <h3>Disconnect Results</h3>
            <p><strong>Status:</strong> {disconnectResult.message}</p>
            
            <div style={{
              backgroundColor: disconnectResult.success ? "#d4edda" : "#f8d7da",
              padding: "15px",
              borderRadius: "5px",
              marginTop: "10px"
            }}>
              <h4>Details:</h4>
              <ul>
                <li>
                  <strong>Session cleared:</strong>
                  {disconnectResult.details.session_cleared ? "✅ Success" : "❌ Failed"}
                </li>
                <li>
                  <strong>Pinecone embeddings deleted:</strong>
                  {disconnectResult.details.pinecone_embeddings_deleted ? "✅ Success" : "❌ Failed"}
                </li>
                <li>
                  <strong>Downloaded files deleted:</strong>
                  {disconnectResult.details.downloaded_files_deleted ? "✅ Success" : "❌ Failed"}
                </li>
                <li>
                  <strong>Mappings deleted:</strong>
                  {disconnectResult.details.mappings_deleted ? "✅ Success" : "❌ Failed"}
                </li>
                <li>
                  <strong>Client secret deleted:</strong>
                  {disconnectResult.details.client_secret_deleted ? "✅ Success" : "❌ Failed"}
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
