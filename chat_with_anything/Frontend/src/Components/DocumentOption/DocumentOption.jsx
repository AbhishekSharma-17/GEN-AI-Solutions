import React from "react";
import "./DocumentOption.css";
import { assets } from "../../assets/assets";
import DocumentCard from "../DocumentCard/DocumentCard";

const DocumentOption = () => {
  const features = [
    {
      img: assets.pdf,
      title: "Chat with PDF",
      description: "Summarize and analyze PDF files quickly.",
    },
    {
      img: assets.ppt,
      title: "Chat with PPT",
      description: "Extract insights from presentations easily.",
    },
    {
      img: assets.csv,
      title: "Chat with CSV",
      description: "Analyze data from spreadsheets effortlessly.",
    },
    {
      img: assets.word,
      title: "Chat with DOC",
      description: "Summarize and extract data from Word files.",
    },
    {
      img: assets.img,
      title: "Chat with Image",
      description: "Extract insights from image files seamlessly.",
    },
    {
      img: assets.rtf,
      title: "Chat with RTF",
      description: "Analyze and summarize RTF documents.",
    },
    {
      img: assets.markdown,
      title: "Chat with Markdown",
      description: "Simplify and extract data from Markdown files.",
    },
    {
      img: assets.html,
      title: "Chat with HTML",
      description: "Extract content and structure from HTML files.",
    },
    {
      img: assets.zip,
      title: "Chat with ZIP",
      description: "Process and analyze ZIP file contents.",
    },
    {
      img: assets.zip,
      title: "Chat with XLS",
      description: "Process and analyze XLS file contents.",
    },
  ];

  return (
    <div className="doc-option-div">
      <div className="card-grid">
        {features.map((feature, index) => (
          <DocumentCard
            key={index}
            icon={feature.img}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </div>
  );
};

export default DocumentOption;
