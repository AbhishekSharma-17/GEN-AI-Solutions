import React, { useContext } from "react";
import "./PDFReview.css";
import { FaPlus } from "react-icons/fa6";
import { FiMinus } from "react-icons/fi";
import { Context } from "../../Context/Context"; // Importing context

const PDFReview = () => {
  const { file, imageCount, tableCount, showReview } = useContext(Context); // Accessing file from context

  // console.log("Received file in PDFReview:", file); // Debugging log

  return (
    <div className="pdf-review">
      <div className="pdf-navbar">
        <div className="image-page-count p-3">
          <div>
            <span id="span-title">
              Image Count:  <span id="span-values">{imageCount}</span>{" "}
            </span>
          </div>
          <div>
            <span id="span-title">
              Table Count: <span id="span-values">{tableCount}</span>{" "}
            </span>
          </div>
        </div>
      </div>
      <div className="review">
        <div className="actual-review">
          {showReview ? (
            <iframe
              src={URL.createObjectURL(file)}
              title="PDF Preview"
              width="100%"
              height="100%"
              style={{ borderRadius: "5px" }}
            />
          ) : (
            <p>No file uploaded. Please upload a PDF to review.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFReview;