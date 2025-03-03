import React, { useContext, useEffect, useRef, useState } from "react";
import "./Main.css";
import { MainContext } from "../../Context/MainContext";
import assets from "../../assets/assets";
import { FaCloudUploadAlt } from "react-icons/fa";
import { FaRegImage } from "react-icons/fa6";
import { HomeContext } from "../../Context/HomeContext";
import Loader from "../../Components/Loader/Loader";
import { toast } from "react-toastify";

const Main = () => {
  const fileInputRef = useRef(null);

  // Add state for posting functionality
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    facebook: false,
    instagram: false,
    twitter: false,
    linkedin: false,
  });
  const [isPosting, setIsPosting] = useState(false);
  const [isPostingAll, setIsPostingAll] = useState(false);

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
    setSelectedCaption,
    generatedCaptions = [],
    setGeneratedCaptions,
    fileName,
    setFileName,
    selectedCaptionTitle,
    setSelectedCaptionTitle,
    selectedCaptionText,
    setSelectedCaptionText,
  } = useContext(MainContext);

  // state from home context
  const { LLMType, API_KEY, groq_API_KEY } = useContext(HomeContext);

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
      setFileName(selectedFile.name);
      const objectURL = URL.createObjectURL(selectedFile);
      setLocalURL(objectURL);

      // Set platform based on file type
      const fileType = selectedFile.type.split("/")[0];
      setPlatformSelected(fileType === "video" ? "video" : "image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    // Generate local URL for the selected file
    const localFileURL = URL.createObjectURL(file);
    setLocalURL(localFileURL); // Store the local URL in state

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
      analyzeFormData.append(
        "is_video",
        platformSelected === "video" ? "true" : "false"
      );
      analyzeFormData.append("interval", "1");
      analyzeFormData.append("llm_type", LLMType === "OpenAI" ? "gpt-4o" : "");

      // Append API keys based on LLM Type
      if (LLMType === "OpenAI") {
        analyzeFormData.append("api_key", API_KEY);
        analyzeFormData.append("groq_api_key", groq_API_KEY);
      } else {
        analyzeFormData.append("groq_api_key", groq_API_KEY);
      }

      // Send request using Fetch API
      const response = await fetch(
        "http://127.0.0.1:8000/analyze_media_and_gen_caption",
        {
          method: "POST",
          body: analyzeFormData,
        }
      );

      // Check if response is OK
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Unknown error");
      }

      // Parse and set the analysis result
      const resultData = await response.json();
      setAnalysisResult(resultData);

      // Extract and set the generated captions
      const captions = resultData.generation.captions;
      setGeneratedCaptions(captions);
    } catch (error) {
      console.error("Error analyzing media:", error);
      if (error.message.includes("Failed to fetch")) {
        console.log(
          "Error connecting to the server. Please check if the backend is running."
        );
      } else {
        console.log(`Error analyzing media: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle checkbox change for platform selection
  const handlePlatformCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setSelectedPlatforms((prev) => ({
      ...prev,
      [value]: checked,
    }));
  };

  // Handle post to all platforms
  const handlePostToAll = (e) => {
    e.preventDefault();
    setSelectedPlatforms({
      facebook: true,
      instagram: true,
      twitter: true,
      linkedin: true,
    });
    handlePost(true);
  };

  // Handle post to selected platforms
  const handlePost = async (postToAll = false) => {
    // Prepare the platforms to post to
    let platformsToPost = [];

    if (postToAll) {
      platformsToPost = ["facebook", "instagram", "twitter", "linkedin"];
    } else {
      platformsToPost = Object.keys(selectedPlatforms).filter(
        (platform) => selectedPlatforms[platform]
      );
    }

    if (platformsToPost.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    if (!selectedCaptionTitle || !selectedCaptionText) {
      toast.error("Please select a caption first");
      return;
    }

    if (postToAll) {
      setIsPostingAll(true);
    } else {
      setIsPosting(true);
    }
    try {
      // Prepare the content
      const content = `${selectedCaptionTitle}\n\n${selectedCaptionText}`;

      // Prepare the payload
      const mediaType = platformSelected === "video" ? "video" : "image";

      // If posting to all platforms at once
      if (postToAll) {
        const payload = {
          content: content,
          media_url: mediaURL,
          media_type: mediaType,
          file_path: uploadedFilePath,
        };

        const response = await fetch("http://127.0.0.1:8000/post/all", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Unknown error");
        }

        console.log("Posted to all platforms successfully");
        toast.success("Posted to all platforms successfully!");
      }
      // If posting to selected platforms individually
      else {
        for (const platform of platformsToPost) {
          const payload = {
            content: content,
            media_url: mediaURL,
            media_type: mediaType,
            file_path: uploadedFilePath,
          };

          const response = await fetch(
            `http://127.0.0.1:8000/post/${platform}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              `Error posting to ${platform}: ${
                errorData.detail || "Unknown error"
              }`
            );
          }

          console.log(`Posted to ${platform} successfully`);
        }

        toast.success("Posted to selected platforms successfully!");
      }
    } catch (error) {
      console.error("Error posting:", error);
      toast.error(`Error posting: ${error.message}`);
    } finally {
      if (postToAll) {
        setIsPostingAll(false);
      } else {
        setIsPosting(false);
      }
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
                  {platformToView || "Select Type of Media"}
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
                <>
                  {/* Only show upload area when no file is selected */}
                  {!fileName && (
                    <div
                      className="image-and-video-upload mt-1 mb-1"
                      onClick={() => fileInputRef.current.click()}
                      style={{ cursor: "pointer" }}
                    >
                      <FaCloudUploadAlt
                        style={{ fontSize: "5em", color: "lightblue" }}
                      />
                      <p>Upload a File or Drag and Drop</p>
                      <p>PNG, JPG, GIF, .mp4</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/gif, video/mp4"
                        className="d-none"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}

                  {/* Separate div for displaying filename */}
                  {fileName && (
                    <div className="file-info-display mt-4 mb-4">
                      <p>Selected File: {fileName}</p>
                    </div>
                  )}
                </>
              )}

              {/* Loader while uploading */}
              {isUploading && (
                <div className="loader">
                  <p>
                    <Loader></Loader>
                  </p>
                </div>
              )}

              {/* Upload Button */}
              {!isUploading && file && !uploadCompleted && (
                <button type="submit" className="btn btn-primary">
                  Upload File
                </button>
              )}

              {/* Analyze Button (Only after upload) */}
              {uploadCompleted && mediaInfo && !analysisResult && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleAnalyzeMedia}
                >
                  {isAnalyzing ? "Analyzing Media..." : "Analyze File"}
                </button>
              )}
            </form>
          )}

          {/* caption display area */}

          <div className="caption">
            <p style={{ fontWeight: "500" }}>Caption</p>
            <div
              className="caption-list"
              style={{
                maxHeight: "500px",
                overflowY: "auto",
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "5px",
              }}
            >
              {generatedCaptions.map((caption, index) => (
                <div key={index} className="caption-item">
                  <p style={{ fontWeight: "500" }}>{caption.title}</p>
                  <p style={{ fontStyle: "italic" }}>{caption.text}</p>
                  <button
                    type="button"
                    id="set-caption-button"
                    className="btn btn-warning"
                    style={{ fontWeight: "bold" }}
                    onClick={() => {
                      setSelectedCaptionTitle(caption.title);
                      setSelectedCaptionText(caption.text);
                    }}
                  >
                    Set Caption
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
                    checked={selectedPlatforms.facebook}
                    onChange={handlePlatformCheckboxChange}
                    disabled={isPosting || isPostingAll}
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
                    checked={selectedPlatforms.linkedin}
                    onChange={handlePlatformCheckboxChange}
                    disabled={isPosting || isPostingAll}
                    style={{ marginRight: "8px" }}
                  />
                  LinkedIn
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
                    checked={selectedPlatforms.twitter}
                    onChange={handlePlatformCheckboxChange}
                    disabled={isPosting || isPostingAll}
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
                    checked={selectedPlatforms.instagram}
                    onChange={handlePlatformCheckboxChange}
                    disabled={isPosting || isPostingAll}
                    style={{ marginRight: "8px" }}
                  />
                  Instagram
                </label>
              </div>
              <div className="btn-div">
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => handlePost(false)}
                  disabled={
                    isPosting ||
                    !selectedCaptionText ||
                    Object.values(selectedPlatforms).every((v) => !v)
                  }
                >
                  {isPosting ? "POSTING..." : "POST"}
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={handlePostToAll}
                  disabled={isPostingAll || !selectedCaptionText}
                >
                  {isPostingAll ? "POSTING..." : "POST TO ALL"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* review area starts here */}
        <div className="review-area">
          <h4>Review</h4>
          <div className="review-image">
            {local_url ? (
              platformSelected === "video" ? (
                <video
                  id="preview-video"
                  src={local_url}
                  controls
                  className="preview-media"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={local_url}
                  alt="Preview"
                  id="preview"
                  className="preview-media"
                />
              )
            ) : (
              <div className="dummy-image-div">
                <FaRegImage style={{ fontSize: "100px", color: "grey" }} />
              </div>
            )}
          </div>
          <div className="content-review">
            <div className="content-review-image">
              <img src={assets.gemini_icon} alt="" />
              <div className="image-name-section">
                <p style={{ fontWeight: "500" }}>GenAI Protos</p>
                <p style={{ color: "grey" }}>Just Now</p>
              </div>
            </div>
            <div className="caption-view">
              <textarea
                value={`${selectedCaptionTitle}\n\n${selectedCaptionText}`}
                onChange={(e) => {
                  const [title, ...text] = e.target.value.split("\n\n");
                  setSelectedCaptionTitle(title);
                  setSelectedCaptionText(text.join("\n\n"));
                }}
                placeholder="Caption"
                rows="4"
                className="form-control"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
