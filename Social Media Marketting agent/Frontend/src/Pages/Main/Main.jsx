import React, { useContext, useEffect, useRef } from "react";
import "./Main.css";
import { MainContext } from "../../Context/MainContext";
import assets from "../../assets/assets";
// import { IoLogoYoutube } from "react-icons/io";
// import { FaGoogleDrive } from "react-icons/fa";
import { FaCloudUploadAlt } from "react-icons/fa";
import { FaRegImage } from "react-icons/fa6";
import { HomeContext } from "../../Context/HomeContext";
import Loader from "../../Components/Loader/Loader";

const Main = () => {
  const fileInputRef = useRef(null);

  // state from main context
  const {
    platformSelected,
    setPlatformSelected,
    platformToView,
    setPlatformToView,
    caption,
    setCaption,
    local_url,
    setLocalURL,
    setFile,
    file,
    backendStatus,
    setBackendStatus,
    isUploading,
    setIsUploading,
    mediaInfo,
    setMediaInfo,
    uploadCompleted,
    setUploadCompleted,
    mediaURL,
    setMediaURL,
    uploadedFilePath,
    setUploadedFilePath,
    isAnalyzing,
    setIsAnalyzing,
    analysisResult,
    setAnalysisResult,
    selectedCaption,
    setSelectedCaption,
    generatedCaptions = [],
    setGeneratedCaptions,
    fileName,
    setFileName,
  } = useContext(MainContext);

  // state from home context
  const {
      LLMType,
      API_KEY,
      groq_API_KEY,
    } = useContext(HomeContext);

  useEffect(() => {
    checkBackendStatus();
  }, []);

  // handling caption change.
  const handleCaptionChange = (e) => {
    setCaption(e.target.value); // Update caption state on input change
  };

  // checking for backend status
  const checkBackendStatus = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/health");
      if (response.ok) {
        setBackendStatus("Connected");
      } else {
        throw new Error("Backend connection failed");
      setFile(selectedFile);
      setFileName(selectedFile.name); // Set the filename in the state
      setUploadCompleted(false); // Reset upload state when a new file is selected
      setMediaInfo(null); // Reset media info
      setFile(selectedFile);
      setFileName(selectedFile.name); // Set the filename in the state
      setUploadCompleted(false); // Reset upload state when a new file is selected
      setMediaInfo(null); // Reset media info
      setFile(selectedFile);
      setFileName(selectedFile.name); // Set the filename in the state
      setLocalURL(URL.createObjectURL(selectedFile)); // Set the local URL for preview
      setFile(selectedFile);
      setFileName(selectedFile.name); // Set the filename in the state
      const objectURL = URL.createObjectURL(selectedFile);
      setLocalURL(objectURL); // Set the local URL for preview
    }
    } catch (error) {
      console.error("Backend connection error:", error);
      setBackendStatus("Disconnected");
    }
  };

  const platforms = [
    {
      value: "image",
      label: "Upload an Image",
      img: assets.hugging_face,
    },
    {
      value: "video",
      label: "Upload Video",
      img: assets.groq,
    },
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name); // Set the filename in the state
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Upload success:", data);

      // Store uploaded file info
      setMediaInfo({
        file_path: data.file_path,
        media_url: data.media_url,
      });

      setMediaURL(data.media_url);
      setUploadedFilePath(data.file_path);
      setUploadCompleted(true); // Mark upload as completed
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // analyze media
  const handleAnalyzeMedia = async () => {
    setIsAnalyzing(true);
    try {
      // Prepare form data
      const analyzeFormData = new FormData();
      analyzeFormData.append("file_path", uploadedFilePath);
      analyzeFormData.append("is_video", platformSelected === "video" ? "true" : "false");
      analyzeFormData.append("interval", "1");
      analyzeFormData.append("llm_type", LLMType === 'OpenAI'?"gpt-4o":'');
  
      console.log('O',API_KEY);
      console.log('g',groq_API_KEY);
      // Append API keys based on LLM Type
      if (LLMType === "OpenAI") {
        analyzeFormData.append("api_key", API_KEY);
        analyzeFormData.append("groq_api_key", groq_API_KEY);
      } else {
        analyzeFormData.append("groq_api_key", groq_API_KEY);
      }
  
      // Send request using Fetch API
      const response = await fetch("http://127.0.0.1:8000/analyze_media_and_gen_caption", {
        method: "POST",
        body: analyzeFormData,
      });
  
      // Check if response is OK
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Unknown error");
      }
  
      // Parse and set the analysis result
      const resultData = await response.json();
      setAnalysisResult(resultData);

      // Extract and set the generated captions
      const captions = resultData.generation.captions.map(caption => `${caption.title}: ${caption.text}`);
      setGeneratedCaptions(captions);
      
    } catch (error) {
      console.error("Error analyzing media:", error);
      if (error.message.includes("Failed to fetch")) {
        console.log("Error connecting to the server. Please check if the backend is running.");
      } else {
        console.log(`Error analyzing media: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  
  return (
    <div className="main-app">
      <div className="main-content">
        <div className="upload-area">
          {/* platform selection work */}

          <div className="platform-selected">
            <div>
              <label
                htmlFor="exampleSelect"
                className="form-label platform-selected-label"
                style={{ fontWeight: "500" }}
              >
                Content Type
              </label>
              <div className="dropdown">
                <button
                  id="customDropdown"
                  className="btn btn-transparent dropdown-toggle w-100 form-input-btn"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {platformToView || "Select Platform"}
                </button>
                <ul
                  className="dropdown-menu w-100"
                  aria-labelledby="dropdownMenuButton"
                >
                  {platforms.map((platform) => (
                    <li key={platform.value}>
                      <button
                        type="button"
                        className="dropdown-item d-flex align-items-center"
                        onClick={() => {
                          setPlatformSelected(platform.value);
                          setPlatformToView(platform.label);
                        }}
                      >
                        <img
                          src={platform.img}
                          alt={platform.label}
                          className="me-2"
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "10px",
                          }}
                  
                />
                        {platform.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* rendering on basis of platform selected */}

          {platformSelected && (
            <form className="section-display" onSubmit={handleSubmit}>
            {/* Image and Video Upload */}
            {!isUploading && !uploadCompleted && (
              <div
                className="image-and-video-upload mt-1 mb-1"
                onClick={() => fileInputRef.current.click()}
                style={{ cursor: "pointer" }}
              >
                {!fileName && (
                  <>
                    <FaCloudUploadAlt
                      style={{ fontSize: "5em", color: "lightblue" }}
                    />
                    <p>Upload a File or Drag and Drop</p>
                    <p>PNG, JPG, GIF, .mp4</p>
                  </>
                )}
                {fileName && <p>Selected File: {fileName}</p>}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/gif, video/mp4"
                  className="d-none"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Loader while uploading */}
            {isUploading && (
              <div className="loader">
                <p><Loader></Loader></p>
              </div>
            )}

            {/* Upload Button */}
            {!isUploading && file && !uploadCompleted && (
              <button type="submit" className="btn btn-primary">
                Upload File
              </button>
            )}

            {/* Display the selected file name within the form tag */}
            {/* {fileName && !uploadCompleted && (
              <p className="file-name-display">Selected File:</p>
            )} */}

            {/* Analyze Button (Only after upload) */}
            {uploadCompleted && mediaInfo && !analysisResult && (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleAnalyzeMedia}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze File"}
              </button>
            )}
            </form>
          )}

          {/* caption display araea */}
          <div className="caption">
            <p style={{ fontWeight: "500" }}>Caption</p>
            <div className="caption-list" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
              {generatedCaptions.map((caption, index) => (
                <div key={index} className="caption-item">
                  <p>{caption}</p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedCaption(caption)}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* post platform option starts here */}
          <div className="post-to-platform">
            <p style={{ fontWeight: "500", marginBottom: "10px" }}>Platform</p>
            <form>
              <div className="platform-option">
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    width: "200px",
                    padding: "10px 15px",
                    borderRadius: "5px",
                  }}
                >
                  <input
                    type="checkbox"
                    value="facebook"
                    style={{ marginRight: "8px" }}
                  />
                  Facebook
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    width: "200px",
                    padding: "10px 15px",
                    borderRadius: "5px",
                  }}
                >
                  <input
                    type="checkbox"
                    value="linkedin"
                    style={{ marginRight: "8px" }}
                  />
                  Linked In
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    width: "200px",
                    padding: "10px 15px",
                    borderRadius: "5px",
                  }}
                >
                  <input
                    type="checkbox"
                    value="twitter"
                    style={{ marginRight: "8px" }}
                  />
                  Twitter
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                    border: "1px solid #ccc",
                    width: "200px",
                    padding: "10px 15px",
                    borderRadius: "5px",
                  }}
                >
                  <input
                    type="checkbox"
                    value="instagram"
                    style={{ marginRight: "8px" }}
                  />
                  Instagram
                </label>
              </div>
              <div className="btn-div">
                <button type="submit" className="btn btn-dark">
                  POST
                </button>
                <button type="submit" className="btn btn-dark">
                  POST TO ALL
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* review area starts here */}
        <div className="review-area">
          <div className="review-section">
            <p style={{ fontWeight: "500" }}>Preview</p>
            <div className="content-review">
              <div className="content-review-image">
                <img src={assets.gemini_icon} alt="" />
                <div className="image-name-section">
                  <p style={{ fontWeight: "500" }}>Your Businnes Name</p>
                  <p style={{ color: "grey" }}>Just Now</p>
                </div>
              </div>
              {local_url ? (
                <div className="review-image">
                  <img src={local_url} alt="" width={30} id="preview" />
                </div>
              ) : (
                <div className="dummy-image-div">
                  <FaRegImage style={{ fontSize: "400px", color: "grey" }} />
                </div>
              )}
              <div className="caption-view">
                <textarea
                  value={selectedCaption}
                  onChange={(e) => setSelectedCaption(e.target.value)}
                  placeholder="Caption"
                  rows="4"
                  className="form-control"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <img src="" id="preview" alt="" /> */}
    </div>
  );
};

export default Main;
