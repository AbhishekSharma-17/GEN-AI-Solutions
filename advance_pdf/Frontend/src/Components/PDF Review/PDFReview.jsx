import React, { useContext, useMemo } from "react";
import "./PDFReview.css";
import { Context } from "../../Context/Context"; // Importing context

const PDFReview = () => {
  const { file, imageCount, tableCount, showReview } = useContext(Context); // Accessing file from context

  console.log("PDFReview Component Rendered");
  console.log("File:", file);
  console.log("Show Review:", showReview);

  // Memoize the file URL to prevent frequent re-renders
  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  return (
    <div className="pdf-review">
      <div className="pdf-navbar">
        <div className="image-page-count p-3">
          <div>
            <span id="span-title">
              Image Count: <span id="span-values">{imageCount}</span>{" "}
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
            fileUrl ? (
              <iframe
                src={fileUrl}
                title="PDF Preview"
                width="100%"
                height="100%"
                style={{ borderRadius: "5px" }}
              />
            ) : (
              <p>Loading PDF...</p>
            )
          ) : (
            <p>No file uploaded. Please upload a PDF to review.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFReview;
