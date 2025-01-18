import React, { useContext } from "react";
import "./DocumentCard.css";
import { Context } from "../../Context/Context";

const DocumentCard = ({ icon, title, description }) => {
  const {
    isCardClicked,
    setIsCardClicked,
    setUploadSectionTitle,
  } = useContext(Context);
  const handleCardClick = () => {
    setIsCardClicked(!isCardClicked);
    setUploadSectionTitle(title);
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
