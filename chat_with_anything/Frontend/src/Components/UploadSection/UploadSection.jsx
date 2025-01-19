import React, { useContext } from "react";
import { FaFilePowerpoint } from "react-icons/fa";
import Loader from "../Loader/Loader";
import { MdOutlineFileUpload } from "react-icons/md";
import "./UploadSection.css";
import { toast } from "react-toastify";
import { Context } from "../../Context/Context";

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
// console.log('extention type : ',extentionType);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setEmbedReady(false);
    setFilePath("");
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const response = await fetch(
        `http://localhost:8000/upload?user_id=${userId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("File upload failed.");
      }

      const data = await response.json();
      setFilePath(data.file_path);
      setEmbedReady(true);
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleEmbedDoc = async () => {
    setInputToken("");
    setOutputToken("");
    setTotalToken("");
    setInputCost("");
    setOutputCost("");
    setTotalCost("");
    setCumulativeTokens("");
    setCumulativeCost("");
    setResponseTime("");
    setEmbededToken("");
    setEmbededCost("");

    if (!filePath) {
      toast.error("No file path found. Please upload a file first.");
      return;
    }

    try {
      setEmbedding(true);
      const response = await fetch(
        `http://localhost:8000/embed?user_id=${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_path: filePath, user_id: userId }),
        }
      );

      if (!response.ok) {
        throw new Error("Embedding document failed.");
      }

      const data = await response.json();
      setFileResponse && setFileResponse(data);

      // Set token values as floats rounded to 2 decimal places
      if (data.query_input_tokens) {
        setInputToken(parseInt(data.query_input_tokens));
      }
      if (data.query_output_tokens) {
        setOutputToken(parseInt(data.query_output_tokens));
      }
      if (data.query_total_tokens) {
        setTotalToken(parseInt(data.query_total_tokens));
      }

      // Set cost values as floats rounded to 2 decimal places
      if (data.query_input_cost) {
        setInputCost(parseFloat(data.query_input_cost).toFixed(4));
      }
      if (data.query_output_cost) {
        setOutputCost(parseFloat(data.query_output_cost).toFixed(4));
      }
      if (data.query_total_cost) {
        setTotalCost(parseFloat(data.query_total_cost).toFixed(3));
      }
      if (data.response_time) {
        setResponseTime(parseFloat(data.response_time).toFixed(2));
      }

      // cumulative token and cost
      if (data.cumulative_tokens) {
        setCumulativeTokens(parseFloat(data.cumulative_tokens).toFixed(2));
      }
      if (data.cumulative_cost) {
        setCumulativeCost(parseFloat(data.cumulative_cost).toFixed(2));
      }

      // embeding token and cost
      if (data.embedding_tokens) {
        setEmbededToken(parseInt(data.embedding_tokens));
      }
      if (data.embedding_cost) {
        setEmbededCost(parseFloat(data.embedding_cost).toFixed(6));
      }

      // Pass the queries to the parent component
      setQueries((prevQueries) => [
        ...prevQueries,
        ...data.queries, // Assuming 'queries' is the response data
      ]);

      // Mark the embedding process as complete
      setIsEmbedComplete(true);
      toast.success("Document embedded successfully!");
    } catch (error) {
      console.error("Error embedding document:", error);
      toast.error("Embedding failed. Please try again.");
    } finally {
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
            {/* <FaFilePowerpoint className="ppt_file_icon" /> */}
            <img src={documentSelectedIcon} alt="" srcset="" className="ppt_file_icon" width={"50px"} />
            <p className="fw-bold">{file.name}</p>
          </div>
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
              Drag and drop your File's here - or click to select.
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
