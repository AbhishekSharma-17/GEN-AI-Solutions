import React, { useState, useEffect } from 'react';

function App() {
  const [connected, setConnected] = useState(false);
  const [files, setFiles] = useState([]);
  const [syncSummary, setSyncSummary] = useState(null);
  const [embedSummary, setEmbedSummary] = useState(null);
  const [message, setMessage] = useState('');

  // Check connection status on load
  const checkStatus = async () => {
    try {
      const res = await fetch('http://localhost:8000/status', { credentials: 'include' });
      const data = await res.json();
      setConnected(data.connected);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Redirect to initiate Dropbox OAuth flow
  const handleConnectClick = () => {
    window.location.href = 'http://localhost:8000/connect';
  };

  // Fetch list of files from Dropbox
  const handleListFiles = async () => {
    try {
      const res = await fetch('http://localhost:8000/list_files', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.entries || []);
      } else {
        setMessage('Failed to fetch files.');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setMessage('An error occurred while fetching files.');
    }
  };

  // Sync files by calling the /sync endpoint
  const handleSyncFiles = async () => {
    try {
      const res = await fetch('http://localhost:8000/sync', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSyncSummary(data);
      } else {
        setSyncSummary({ message: 'Failed to sync files.' });
      }
    } catch (error) {
      console.error('Error syncing files:', error);
      setSyncSummary({ message: 'An error occurred during sync.' });
    }
  };

  // Embed downloaded data by calling the /embed endpoint
  const handleEmbedData = async () => {
    try {
      const res = await fetch('http://localhost:8000/embed', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEmbedSummary(data);
      } else {
        setEmbedSummary({ message: 'Failed to embed data.' });
      }
    } catch (error) {
      console.error('Error embedding data:', error);
      setEmbedSummary({ message: 'An error occurred during embedding.' });
    }
  };

  // Disconnect from Dropbox
  const handleDisconnect = async () => {
    try {
      const res = await fetch('http://localhost:8000/disconnect', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        setConnected(false);
        setFiles([]);
        setSyncSummary(null);
        setEmbedSummary(null);
      } else {
        setMessage('Failed to disconnect.');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      setMessage('An error occurred while disconnecting.');
    }
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h1>Dropbox AI Integration</h1>
      <p>Status: {connected ? 'Connected' : 'Not connected'}</p>
      {message && <p>{message}</p>}
      <hr style={{ margin: '2rem 0' }} />
      {!connected && (
        <button onClick={handleConnectClick}>Connect to Dropbox</button>
      )}
      {connected && (
        <>
          <button onClick={handleListFiles}>List Files</button>
          <button onClick={handleSyncFiles} style={{ marginLeft: '1rem' }}>
            Sync Files
          </button>
          <button onClick={handleEmbedData} style={{ marginLeft: '1rem' }}>
            Embed Data
          </button>
          <button onClick={handleDisconnect} style={{ marginLeft: '1rem' }}>
            Disconnect
          </button>
          {files.length > 0 && (
            <div>
              <h2>Files in Dropbox:</h2>
              <ul>
                {files.map((file) => (
                  <li key={file.id}>
                    {file.name} {file[".tag"] ? `(${file[".tag"]})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {syncSummary && (
            <div>
              <h2>Sync Summary:</h2>
              <pre>{JSON.stringify(syncSummary, null, 2)}</pre>
            </div>
          )}
          {embedSummary && (
            <div>
              <h2>Embed Summary:</h2>
              <pre>{JSON.stringify(embedSummary, null, 2)}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;