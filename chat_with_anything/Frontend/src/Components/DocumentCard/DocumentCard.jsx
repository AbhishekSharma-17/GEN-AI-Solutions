import React, { useContext } from "react";
import "./DocumentCard.css";
import { Context } from "../../Context/Context";

const DocumentCard = ({ icon, title, description }) => {
  const {
    isCardClicked,
    setIsCardClicked,
    setUploadSectionTitle,
    setDocumentSelectedIcon,
    setExtentionType,
  } = useContext(Context);

  const handleCardClick = () => {
    setIsCardClicked(!isCardClicked);
    setUploadSectionTitle(title);
    setDocumentSelectedIcon(icon);

    // Use the title directly instead of uploadSectionTitle
    if (title === "Chat with PDF") {
      setExtentionType(".pdf");
    } else if (title === "Chat with PPT") {
      setExtentionType(".ppt, .pptx");
    } else if (title === "Chat with CSV") {
      setExtentionType(".csv");
    } else if (title === "Chat with DOC") {
      setExtentionType(".doc, .docx");
    } else if (title === "Chat with Image") {
      setExtentionType(".png, .jpg, .jpeg, .bmp, .gif, .tiff, .webp");
    } else if (title === "Chat with RTF") {
      setExtentionType(".rtf");
    } else if (title === "Chat with Markdown") {
      setExtentionType(".md");
    } else if (title === "Chat with HTML") {
      setExtentionType(".html, .htm");
    } else if (title === "Chat with ZIP") {
      setExtentionType(".zip");
    } else if (title === "Chat with XLS") {
      setExtentionType(".xls, .xlsx");
    }
  };

  return (
    <div className="card" onClick={handleCardClick}>
      <img src={icon} alt={`${title} Icon`} className="card-icon" />
      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>
    </div>
  );
};

export default DocumentCard;
