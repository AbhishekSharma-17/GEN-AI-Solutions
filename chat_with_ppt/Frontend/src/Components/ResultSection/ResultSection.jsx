import React from "react";
import assets from "../../assets/assets";

const ResultSection = ({ recentPrompt, resultData, loadings }) => (
  <div className="result">
    <div className="result-title">
      <img src={assets.user_icon} alt="" />
      <p>{recentPrompt}</p>
    </div>
    <div className="result-data">
      <img src={assets.gemini_icon} alt="" />
      {loadings ? (
        <div className="loader">
          <hr />
          <hr />
          <hr />
        </div>
      ) : (
        <p dangerouslySetInnerHTML={{ __html: resultData }}></p>
      )}
    </div>
  </div>
);

export default ResultSection;
