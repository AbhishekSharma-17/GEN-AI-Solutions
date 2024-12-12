import React, { useContext } from "react";
import assets from "../../assets/assets"; // Make sure to import assets if needed
import { Context } from "../../context/Context";
import Loader from "../Loader/Loader";

const ResultDisplay = ({ recentPrompt, resultData, loadings }) => {
  const { queries, setQueries } = useContext(Context);

  return (
    <div className="main-chat-section">
      {queries.map((query, index) => {
        <div className="result">
          <div className="result-title">
            <img src={assets.user_icon} alt="" />
            <p>{query.question}</p>
          </div>
          <div className="result-data">
            <img src={assets.gemini_icon} alt="" />
            {loadings ? <Loader/>: (
              <p dangerouslySetInnerHTML={{ __html: query.response }}></p>
            )}
          </div>
        </div>;
      })}
    </div>
  );
};

export default ResultDisplay;
