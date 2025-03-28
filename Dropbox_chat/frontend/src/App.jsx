import React, { useState, useEffect } from "react";

function App() {
  const [connected, setConnected] = useState(false);
  const [files, setFiles] = useState([]);
  const [syncSummary, setSyncSummary] = useState(null);
  const [embedSummary, setEmbedSummary] = useState(null);
  const [chatAnswer, setChatAnswer] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  // Check connection status on component mount
  const checkStatus = async () => {
    try {
      const res = await fetch("http://localhost:8000/status", { credentials: "include" });
      const data = await res.json();
      setConnected(data.connected);
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Initiate Dropbox OAuth flow
  const handleConnectClick = () => {
    window.location.href = "http://localhost:8000/connect";
  };

  // List files from Dropbox
  const handleListFiles = async () => {
    try {
      const res = await fetch("http://localhost:8000/list_files", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.entries || []);
      } else {
        setMessage("Failed to fetch files.");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      setMessage("An error occurred while fetching files.");
    }
  };

  // Sync files from Dropbox
  const handleSyncFiles = async () => {
    try {
      const res = await fetch("http://localhost:8000/sync", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSyncSummary(data);
        // Optionally refresh file list after sync
        await handleListFiles();
      } else {
        setSyncSummary({ message: "Failed to sync files." });
      }
    } catch (error) {
      console.error("Error syncing files:", error);
      setSyncSummary({ message: "An error occurred during sync." });
    }
  };

  // Embed downloaded file data into Pinecone
  const handleEmbedData = async () => {
    try {
      const res = await fetch("http://localhost:8000/embed", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEmbedSummary(data);
      } else {
        setEmbedSummary({ message: "Failed to embed data." });
      }
    } catch (error) {
      console.error("Error embedding data:", error);
      setEmbedSummary({ message: "An error occurred during embedding." });
    }
  };

  // Chat with the embedded data (streaming response)
  const handleChat = async () => {
    setChatAnswer(""); // Clear previous answer
    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_query: query }),
      });
      if (res.ok) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let result = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          result += decoder.decode(value);
          setChatAnswer(result);
        }
      } else {
        setChatAnswer("Failed to get answer.");
      }
    } catch (error) {
      console.error("Error during chat:", error);
      setChatAnswer("An error occurred during chat.");
    }
  };

  // Disconnect from Dropbox
  const handleDisconnect = async () => {
    try {
      const res = await fetch("http://localhost:8000/disconnect", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMessage(data.message);
        setConnected(false);
        setFiles([]);
        setSyncSummary(null);
        setEmbedSummary(null);
        setChatAnswer("");
      } else {
        setMessage("Failed to disconnect.");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      setMessage("An error occurred while disconnecting.");
    }
  };

  return (
    <div style={{ margin: "2rem" }}>
      <h1>Dropbox AI Integration</h1>
      <p>Status: {connected ? "Connected" : "Not connected"}</p>
      {message && <p>{message}</p>}
      <hr style={{ margin: "2rem 0" }} />
      {!connected && (
        <button onClick={handleConnectClick}>Connect to Dropbox</button>
      )}
      {connected && (
        <>
          <button onClick={handleListFiles}>List Files</button>
          <button onClick={handleSyncFiles} style={{ marginLeft: "1rem" }}>
            Sync Files
          </button>
          <button onClick={handleEmbedData} style={{ marginLeft: "1rem" }}>
            Embed Data
          </button>
          <button onClick={handleDisconnect} style={{ marginLeft: "1rem" }}>
            Disconnect
          </button>
          <div style={{ marginTop: "2rem" }}>
            <h2>Chat with Dropbox Data</h2>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query"
              style={{ width: "400px", padding: "0.5rem" }}
            />
            <button onClick={handleChat} style={{ marginLeft: "1rem" }}>
              Ask
            </button>
            {chatAnswer && (
              <div style={{ marginTop: "1rem" }}>
                <h3>Answer:</h3>
                <p>{chatAnswer}</p>
              </div>
            )}
          </div>
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
              <p>{syncSummary.message}</p>
              <ul>
                <li>Total Items: {syncSummary.total_items}</li>
                <li>Folders Count: {syncSummary.folders_count}</li>
                <li>Files Count: {syncSummary.files_count}</li>
                <li>New Downloads: {syncSummary.new_downloads_count}</li>
                <li>Skipped Files: {syncSummary.skipped_files_count}</li>
                <li>Unsupported Files: {syncSummary.unsupported_files_count}</li>
                <li>Failed Files: {syncSummary.failed_files_count}</li>
              </ul>
            </div>
          )}
          {embedSummary && (
            <div>
              <h2>Embed Summary:</h2>
              <p>{embedSummary.message}</p>
              <p>
                Processed Files:{" "}
                {embedSummary.processed_files && embedSummary.processed_files.join(", ")}
              </p>
              <p>
                Skipped Files:{" "}
                {embedSummary.skipped_files && embedSummary.skipped_files.join(", ")}
              </p>
              <p>Total Chunks: {embedSummary.total_chunks}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
