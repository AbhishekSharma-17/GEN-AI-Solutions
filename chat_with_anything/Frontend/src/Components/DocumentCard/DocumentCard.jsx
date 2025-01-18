import React from "react";
import './DocumentCard.css'

const DocumentCard = ({ icon, title, description }) => {
  return (
    <div className="card">
      <img src={icon} alt={`${title} Icon`} className="card-icon" />
      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>
    </div>
  );
};

export default DocumentCard;
