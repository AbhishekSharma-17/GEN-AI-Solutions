import React, { useContext, useState } from "react";
import "./Upload.css";
import { FiUpload } from "react-icons/fi";
import { Context } from "../../Context/Context"; // Importing context
import { BsFileEarmarkPdfFill } from "react-icons/bs";
import Loader from "../Loader/Loader";
import { toast } from "react-toastify";

const Upload = () => {
  const {
    file,
    setLocalFile,
    uploading,
    setUploading,
    userId,
    setFilePath,
    setInputToken,
    setOutputToken,
    setTotalToken,
    setInputCost,
    setOutputCost,
    setTotalCost,
    setResponseTime,
    setCumulativeTokens,
    setCumulativeCost,
    setEmbededToken,
    setEmbededCost,
    setQueries,
    setIsEmbedComplete,
    setFileResponse,
    setInitialQueries,
  } = useContext(Context); // Accessing setFile from context

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    console.log("uploaded file url", uploadedFile);

    if (uploadedFile) {
      setLocalFile(uploadedFile);
    }
  };

  const handleFileUploadAndEmbed = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Start uploading process
      setUploading(true);
      const uploadResponse = await fetch(
        `http://localhost:8000/upload?user_id=${userId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("File upload failed.");
      }

      const uploadData = await uploadResponse.json();
      setFilePath(uploadData.file_path);
      const embedResponse = await fetch(
        `http://localhost:8000/embed?user_id=${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: uploadData.file_path,
            user_id: userId,
          }),
        }
      );

      if (!embedResponse.ok) {
        throw new Error("Embedding document failed.");
      }

      const embedData = await embedResponse.json();
      setFileResponse && setFileResponse(embedData);
      setInitialQueries(embedData.queries);

      // Update state with embedding results
      if (embedData.query_input_tokens)
        setInputToken(parseInt(embedData.query_input_tokens));
      if (embedData.query_output_tokens)
        setOutputToken(parseInt(embedData.query_output_tokens));
      if (embedData.query_total_tokens)
        setTotalToken(parseInt(embedData.query_total_tokens));
      if (embedData.query_input_cost)
        setInputCost(parseFloat(embedData.query_input_cost).toFixed(4));
      if (embedData.query_output_cost)
        setOutputCost(parseFloat(embedData.query_output_cost).toFixed(4));
      if (embedData.query_total_cost)
        setTotalCost(parseFloat(embedData.query_total_cost).toFixed(3));
      if (embedData.response_time)
        setResponseTime(parseFloat(embedData.response_time).toFixed(2));
      if (embedData.cumulative_tokens)
        setCumulativeTokens(parseFloat(embedData.cumulative_tokens).toFixed(2));
      if (embedData.cumulative_cost)
        setCumulativeCost(parseFloat(embedData.cumulative_cost).toFixed(2));
      if (embedData.embedding_tokens)
        setEmbededToken(parseInt(embedData.embedding_tokens));
      if (embedData.embedding_cost)
        setEmbededCost(parseFloat(embedData.embedding_cost).toFixed(6));

      // Update queries and mark embedding as complete
      setQueries((prevQueries) => [...prevQueries, ...embedData.queries]);
      setIsEmbedComplete(true);
      toast.success("Document embedded successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="actual-upload">
      <div className="prototype-name">
        <p>Chat With PDF</p>
      </div>
      {file === null ? (
        <div className="file-upload">
          <label htmlFor="file-upload-input" className="select-button">
            <FiUpload style={{ fontSize: "50px" }} />
          </label>
          <h3>Upload your PDF</h3>
          <p>Drag and drop your file here, or click to select</p>
          <input
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            id="file-upload-input"
            onChange={handleFileChange} // Handle file change
          />
        </div>
      ) : (
        <div className="file-upload">
          <div
            className="file-data"
            style={{
              border: "1px solid grey",
              padding: "10px",
              borderRadius: "5px",
              color: "black",
              fontWeight: "bold",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <BsFileEarmarkPdfFill style={{ fontSize: "25px", color: "red" }} />
            <p>{file.name}</p>
          </div>
          {!uploading ? (
            <button className="btn btn-dark" onClick={handleFileUploadAndEmbed}>
              Upload File
            </button>
          ) : (
            <Loader></Loader>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
