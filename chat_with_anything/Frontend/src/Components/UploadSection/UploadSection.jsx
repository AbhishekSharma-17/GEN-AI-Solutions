import React, { useContext } from "react";
import { MdOutlineFileUpload } from "react-icons/md";
import Loader from "../Loader/Loader";
import "./UploadSection.css";
import { toast } from "react-toastify";
import { Context } from "../../Context/Context";

const UploadSection = ({
  file,
  setFile,
  uploading,
  setUploading,
  embedding,
  setEmbedding,
  filePath,
  setFilePath,
  fileInputRef,
  setFileResponse,
  setIsEmbedComplete,
  setQueries,
}) => {
  const {
    userId,
    setInputToken,
    setOutputToken,
    setTotalToken,
    setInputCost,
    setOutputCost,
    setTotalCost,
    setCumulativeTokens,
    setCumulativeCost,
    setResponseTime,
    setEmbededToken,
    setEmbededCost,
    documentSelectedIcon,
    extentionType,
  } = useContext(Context);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setFilePath("");
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
      toast.success("File uploaded successfully!");

      // Start embedding process
      setEmbedding(true);

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
      setEmbedding(false);
    }
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        onChange={handleFileChange}
        accept={extentionType}
        ref={fileInputRef}
        hidden
      />
      <div className="upload-section">
        {file && (
          <div className="file-name d-flex justify-content-center align-items-center gap-2">
            <img
              src={documentSelectedIcon}
              alt=""
              className="ppt_file_icon"
              width={"50px"}
            />
            <p className="fw-bold">{file.name}</p>
          </div>
        )}
        {uploading || embedding ? (
          <Loader />
        ) : (
          <>
            {!file ? (
              <div
                onClick={() => fileInputRef.current.click()}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                }}
                className="file-upload-div"
              >
                <MdOutlineFileUpload
                  style={{
                    cursor: "pointer",
                    fontSize: "5rem",
                    textAlign: "center",
                  }}
                  className="file-upload-icon-style"
                />
                <p className="file-icon-upload-text">
                  Drag and drop your File's here - or click to select.
                </p>
              </div>
            ) : (
              <button
                onClick={handleFileUploadAndEmbed}
                className="btn btn-dark"
              >
                Upload File
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UploadSection;
