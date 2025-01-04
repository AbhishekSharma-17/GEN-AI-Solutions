import React, { useContext, useState } from "react";
import { TbFileTextSpark } from "react-icons/tb";
import { FiCopy, FiDownload } from "react-icons/fi";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { LuAlarmClock } from "react-icons/lu";
import { AiFillThunderbolt } from "react-icons/ai";

import "./ConversionResult.css";
import { Context } from "../../Context/Context";

const ConversionResult = ({ conversionResults }) => {
  const [activeTab, setActiveTab] = useState(0);
  const {initaliseModelName} = useContext(Context);
  
  

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  const formatFilename = (filename) => {
    return filename.replace(/\.sql$/, ".py");
  };

  const handleCopy = () => {
    const code = conversionResults[activeTab].conversion.pysparkCode || "";
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  const handleDownload = () => {
    const code = conversionResults[activeTab].conversion.pysparkCode || "";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = formatFilename(conversionResults[activeTab].filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const zip = new JSZip();

    conversionResults.forEach((result) => {
      const code = result.conversion.pysparkCode || "No PySpark code available";
      const filename = formatFilename(result.filename);
      zip.file(filename, code);
    });

    zip.generateAsync({ type: "blob" }).then((content) => {
      saveAs(content, "converted_files.zip");
    });
  };

  return (
    <div className="conversion-result">
      {conversionResults && conversionResults.length > 0 ? (
        <div className="tabs-container">
          <div className="tabs">
            {conversionResults.map((result, index) => (
              <button
                key={index}
                className={`tab ${activeTab === index ? "active" : ""}`}
                onClick={() => handleTabClick(index)}
              >
                <span role="img" aria-label="file-icon">
                  <TbFileTextSpark
                    style={{ fontSize: "20px", color: "black" }}
                  />
                </span>{" "}
                {formatFilename(result.filename)}
              </button>
            ))}
          </div>
          <div className="tab-content">
            <div className="sticky-header-container">
              <div className="d-flex justify-content-between align-items-center sticky-header p-0 m-0">
                <p
                  style={{ fontFamily: "monospace", color: "grey" }}
                  className="stickeyHeader-title"
                >
                  sql to pySpark
                </p>
                <div className="buttons d-flex gap-3 m-0 p-0">
                  <div className="hover-container">
                    <div className="get-insights hover-text">
                      <AiFillThunderbolt style={{color:"orange"}} />
                      <span className="">Get Insights</span>
                    </div>
                    <div className="hover-div">
                      {/* hover insights */}
                      <div className="hover-insights">
                        <p>Insights</p>
                        <p id="hover-model">{initaliseModelName}</p>
                      </div>
                      {/* input/output token */}
                      <div className="insight-token">
                        <p>Input / Output Token</p>
                        <div className="tokens-value">
                          <div className="values">
                            <span>
                              {
                                conversionResults[activeTab].conversion
                                  .input_tokens
                              }
                            </span>
                            <p className="token-heading">Input Token</p>
                          </div>
                          <div className="values">
                            <span>
                              {
                                conversionResults[activeTab].conversion
                                  .output_tokens
                              }
                            </span>
                            <p className="token-heading">Output Token</p>
                          </div>
                          <div className="values">
                            <span>
                              {
                                conversionResults[activeTab].conversion
                                  .total_tokens
                              }
                            </span>
                            <p className="token-heading">Total Token</p>
                          </div>
                        </div>
                      </div>
                      {/* input / output and total cost  */}
                      <div className="insight-token" id="insight-cost">
                        <p>
                          Input / Output Cost{" "}
                          <span style={{ fontSize: "15px", color: "grey" }}>
                            ( in USD )
                          </span>
                        </p>
                        <div className="tokens-value">
                          <div className="values">
                            <span>
                              {
                                conversionResults[activeTab].conversion
                                  .input_cost
                              }
                            </span>
                            <p className="token-heading">Input Cost</p>
                          </div>
                          <div className="values">
                            <span>
                              {
                                conversionResults[activeTab].conversion
                                  .output_cost
                              }
                            </span>
                            <p className="token-heading">Output Cost</p>
                          </div>
                          <div className="values">
                            <span>
                              {
                                conversionResults[activeTab].conversion
                                  .total_cost
                              }
                            </span>
                            <p className="token-heading">Total Cost</p>
                          </div>
                        </div>
                      </div>
                      {/* response time */}
                      <div className="response-time">
                        <LuAlarmClock />
                        <p>
                          Response time :{" "}
                          {conversionResults[
                            activeTab
                          ].conversion.response_time.toFixed(2)}{" "}
                          's{" "}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p onClick={handleCopy} className="copy-btn">
                    <FiCopy />
                  </p>
                  <p onClick={handleDownload} className="download-btn">
                    <FiDownload />
                  </p>
                </div>
              </div>
            </div>
            <div className="code-scrollable">
              <pre className="code-content">
                {conversionResults[activeTab].conversion.pysparkCode ||
                  "No PySpark code available"}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <p>No conversion results to display.</p>
      )}

      <button
        onClick={handleDownloadAll}
        className="btn btn-dark download-all-btn mb-3 mt-5"
      >
        📁 Download All Files
      </button>
    </div>
  );
};

export default ConversionResult;
