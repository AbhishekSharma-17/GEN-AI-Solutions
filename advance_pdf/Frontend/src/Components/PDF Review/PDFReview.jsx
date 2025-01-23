import React, { useContext } from "react";
import "./PDFReview.css";
import { FaPlus } from "react-icons/fa6";
import { FiMinus } from "react-icons/fi";
import { Document, Page, pdfjs } from "react-pdf";
import { Context } from "../../Context/Context"; // Importing context

// Set the workerSrc to a valid pdf.worker.js file for version 4.1.6
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@2.10.377/build/pdf.worker.min.js`;

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
          {file ? (
            <Document file={file}>
              <Page pageNumber={1} />
            </Document>
          ) : (
            <p>No file uploaded. Please upload a PDF to review.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFReview;
