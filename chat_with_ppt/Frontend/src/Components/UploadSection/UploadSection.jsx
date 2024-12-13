import React from "react";
import { FaFilePowerpoint } from "react-icons/fa";
import Loader from "../Loader/Loader";
import { MdOutlineFileUpload } from "react-icons/md";

const UploadSection = ({
  file,
  setFile,
  uploading,
  setUploading,
  embedReady,
  setEmbedReady,
  embedding,
  setEmbedding,
  filePath,
  setFilePath,
  fileInputRef,
  setFileResponse,
  setIsEmbedComplete, // New prop
  setQueries, // Add setQueries prop
}) => {
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setEmbedReady(false);
    setFilePath("");
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed.");
      }

      const data = await response.json();
      setFilePath(data.file_path);
      setEmbedReady(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleEmbedDoc = async () => {
    if (!filePath) {
      alert("No file path found. Please upload a file first.");
      return;
    }

    try {
      setEmbedding(true);
      const response = await fetch("http://localhost:8000/embed", {
        method: "POST",
        body: JSON.stringify({ file_path: filePath }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Embedding document failed.");
      }

      const data = await response.json();
      setFileResponse && setFileResponse(data);

      // Pass the queries to the parent component
      setQueries((prevQueries) => [
        ...prevQueries,
        ...data.queries, // Assuming 'queries' is the response data
      ]);

      // Mark the embedding process as complete
      setIsEmbedComplete(true);
    } catch (error) {
      console.error("Error embedding document:", error);
      alert("Embedding failed. Please try again.");
    } finally {
      setEmbedding(false);
    }
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".ppt, .pptx"
        ref={fileInputRef}
        hidden
      />
      <div className="upload-section">
        {file && (
          <p className="file-name">
            <FaFilePowerpoint className="ppt_file_icon" />
            {file.name}
          </p>
        )}
        {uploading || embedding ? (
          <Loader />
        ) : !file ? (
          <>
            <MdOutlineFileUpload
              onClick={() => fileInputRef.current.click()}
              style={{ cursor: "pointer", fontSize: "5rem" }}
              className="file-upload-icon-style"
            />
            <p className="file-icon-upload-text">
              Drag and drop your .PPT, .PPTX here - or click to select.
            </p>
          </>
        ) : !embedReady ? (
          <button onClick={handleFileUpload} className="btn btn-dark">
            Upload File
          </button>
        ) : (
          <button onClick={handleEmbedDoc} className="btn btn-dark">
            Embed Doc
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadSection;
