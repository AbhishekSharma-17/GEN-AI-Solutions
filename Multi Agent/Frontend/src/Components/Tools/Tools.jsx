import React from "react";
import './Tools.css'

const toolsList = [
  "WikipediaTool",
  "ArXivTool",
  "WebScrapeTool",
  "search_web",
  "RAGTool",
  "FileReadTool",
  "FileWriteTool",
];

const Tools = () => {
  return (
    <div className="tools-div-layout">
      <div className="tools-flex">
        {toolsList.map((tool, index) => (
          <div key={index} className="tool-card">
            {tool}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tools;
