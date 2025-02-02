import React, { useContext } from "react";
import "./Main.css";
import { MainContext } from "../../Context/MainContext";
import assets from "../../assets/assets";
import { IoLogoYoutube } from "react-icons/io";
import { FaGoogleDrive } from "react-icons/fa";
import { FaCloudUploadAlt } from "react-icons/fa";

const Main = () => {
  // handling caption change.
  const handleCaptionChange = (e) => {
    setCaption(e.target.value); // Update caption state on input change
  };

  const {
    platformSelected,
    setPlatformSelected,
    platformToView,
    setPlatformToView,
    caption,
    setCaption,
  } = useContext(MainContext);

  const platforms = [
    {
      value: "youtube",
      label: "YouTube URL",
      img: assets.chatGPTIcon,
    },
    {
      value: "googleDrive",
      label: "Google Drive URL",
      img: assets.anthropic,
    },
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
          <div className="section-display">
            {platformSelected === "youtube" ? (
              <div className="youtube-url mt-1 mb-1">
                <div class="input-group">
                  <span class="input-group-text" id="inputGroup-sizing-default">
                    <IoLogoYoutube style={{ color: "red", fontSize: "20px" }} />
                  </span>
                  <input
                    type="text"
                    class="form-control"
                    aria-label="Sizing example input"
                    aria-describedby="inputGroup-sizing-default"
                    placeholder="Paste YouTube URL"
                  />
                </div>
              </div>
            ) : null}
            {/* google drive url */}
            {platformSelected === "googleDrive" ? (
              <div className="googleDrive-url mt-1 mb-1">
                <div class="input-group">
                  <span class="input-group-text" id="inputGroup-sizing-default">
                    <FaGoogleDrive
                      style={{ color: "grey", fontSize: "20px" }}
                    />
                  </span>
                  <input
                    type="text"
                    class="form-control"
                    aria-label="Sizing example input"
                    aria-describedby="inputGroup-sizing-default"
                    placeholder="Paste Google Drive URL"
                  />
                </div>
              </div>
            ) : null}

            {/* image and video upload */}
            {platformSelected === "image" || platformSelected === "video" ? (
              <div className="image-and-video-upload mt-1 mb-1">
                <FaCloudUploadAlt
                  style={{ fontSize: "5em", color: "lightblue" }}
                />
                <p>Upload a File or Drag and Drop</p>
                <p>PNG, JPG, GIF, .mp4</p>

                <input
                  id="file-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/gif, video/mp4"
                  className="d-none"
                  onChange={(e) => {
                    // Handle file upload
                    const file = e.target.files[0];
                    if (file) {
                      console.log("Selected file:", file);
                    }
                  }}
                />
              </div>
            ) : null}
          </div>

          {/* caption display araea */}
          <div className="caption">
            <p style={{ fontWeight: "500" }}>Caption</p>
            <div className="caption-area">
              <textarea
                value={caption}
                onChange={handleCaptionChange}
                placeholder="Enter your caption here"
                rows="10"
                className="form-control"
                // disabled={caption.length > 20} // Correct way to conditionally disable the textarea
              />
            </div>
            <p style={{ fontSize: "15px", fontWeight: "500", color: "grey" }}>
              {caption.length} / 2000 Characters
            </p>
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
                    value="facebook"
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
                    value="facebook"
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
                    value="facebook"
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
              <div className="review-image">
                <img src={assets.mockImage} alt="" width={30} />
              </div>
              <div className="caption-view">
                <p style={{ color: "rgb(147, 144, 144)", fontWeight: "500" }}>
                  {caption || "Caption..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main;
