import React, { useContext, useState } from "react";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import "./Sidebar.css";

const Sidebar = () => {
  const handleExtension = () => {
    setExtended((prevExtended) => {
      console.log("Toggling extended from", prevExtended, "to", !prevExtended);
      return !prevExtended;
    });
  };

  const [extended, setExtended] = useState(true);
  const {
    previousPrompt,
    inputToken,
    setInputToken,
    outputToken,
    setOutputToken,
    totalToken,
    setTotalToken,
    inputCost,
    setInputCost,
    outputCost,
    setOutputCost,
    totalCost,
    setTotalCost,
    cumulativeTokens,
    setCumulativeTokens,
    cumulativeCost,
    setCumulativeCost,
    responseTime,
    setResponseTime,
    modelName,
  } = useContext(Context);

  return (
    <div className={`sidebar ${extended ? "extended" : "collapsed"}`}>
      <div className="top">
        <img
          onClick={handleExtension}
          className="menu"
          src={assets.menu_icon}
          alt="menu_icon"
        />

        {extended ? (
          <div className="token-display">
            <div className="latency">
              <span>{responseTime || 0} s</span>
              <p>Response Time</p>
            </div>
            <div className="tokens">
              <span>$ {totalCost || 0}</span>
              <p>Response Cost</p>
            </div>

            <div className="hover-content">
              <div className="speed-insights">
                <p>Insights</p>
                {modelName ? (
                  <p className="speed-insight-model-name">{modelName}</p>
                ) : null}
              </div>

              <div style={{ padding: "10px" }}>
                <p className="token-details-title">Tokens </p>
                <div className="input-output-token">
                  <div className="input-token">
                    <span className="token-value">{inputToken || "N/A"}</span>
                    <span className="token-title">Input token</span>
                  </div>
                  <div className="output-token">
                    <span className="token-value">{outputToken || "N/A"}</span>
                    <span className="token-title">Output token</span>
                  </div>
                  <div className="total-token">
                    <span className="token-value">{totalToken || "N/A"}</span>
                    <span className="token-title">Total token</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: "10px" }}>
                <p className="token-details-title">
                  Approx Cost <span style={{ fontSize: "15px" }}>(in USD)</span>
                </p>
                <div className="inference-time">
                  <div className="input-inference">
                    <span className="token-value">{inputCost || "N/A"}</span>
                    <span className="token-title">Input cost</span>
                  </div>
                  <div className="output-inference">
                    <span className="token-value">{outputCost || "N/A"}</span>
                    <span className="token-title">Output cost</span>
                  </div>
                  <div className="total-inference">
                    <span className="token-value">{totalCost || "N/A"}</span>
                    <span className="token-title">Total cost</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: "10px" }}>
                <p className="token-details-title">Cummulative </p>
                <div className="cumulative-token-cost">
                  <div className="cumulative-cost">
                    <span className="token-value">{cumulativeCost}</span>
                    <span className="token-title">Cummulative Cost</span>
                  </div>
                  <div className="cumulative-token">
                    <span className="token-value">{cumulativeTokens}</span>
                    <span className="token-title">Cummulative Token</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {extended ? <p className="recent-title">Recents</p> : null}
        {extended ? (
          <div className="recent">
            {previousPrompt.map((item, index) => {
              return (
                <div className="recent-entry" key={index}>
                  <img src={assets.message_icon} alt="" />
                  <p className="">
                    {item.length > 15 ? item.slice(0, 20) + "..." : item}
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
      <div className="bottom">
        {extended ? (
          <p className="sidebar-bottom-para-text">
            <a href="https://www.genaiprotos.com/">
              <img src={assets.genAILogo} alt="" width={150} />
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default Sidebar;
