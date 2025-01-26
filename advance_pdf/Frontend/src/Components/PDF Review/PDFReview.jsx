import React, { useContext } from "react";
import "./PDFReview.css";
import { FaPlus } from "react-icons/fa6";
import { FiMinus } from "react-icons/fi";
import { Context } from "../../Context/Context"; // Importing context



const PDFReview = () => {
  const { file } = useContext(Context); // Accessing file from context

  console.log("Received file in PDFReview:", file); // Debugging log

  return (
    <div className="pdf-review">
      <div className="pdf-navbar">
        <div className="pdf-zoom">
          <FiMinus id="zoom-in" />
          <span className="zoom-level">100%</span>
          <FaPlus id="zoom-out" />
        </div>
        <div className="image-page-count">
          <div>
            <span id="span-title">
              Images: <span id="span-values">2</span>{" "}
            </span>
          </div>
          <div>
            <span id="span-title">
              Table: <span id="span-values">2</span>
            </span>
          </div>
          <div>
            <span id="span-title">
              Page's: <span id="span-values">2</span>
            </span>
          </div>
        </div>
      </div>
      <div className="review">
        <div className="actual-review">
          {/* {file ? (
            "Hai PDF"
          ) : (
            <p>No file uploaded. Please upload a PDF to review.</p>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default PDFReview;
