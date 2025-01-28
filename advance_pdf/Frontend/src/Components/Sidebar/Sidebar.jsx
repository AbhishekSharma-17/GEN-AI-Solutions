import React, { useContext } from "react";
import "./Sidebar.css";
import { Context } from "../../Context/Context";
import { HiCurrencyDollar } from "react-icons/hi2";
import { LuAlarmClockCheck } from "react-icons/lu";

const Sidebar = () => {
  const {
    selectedModel,
    inputToken,
    outputToken,
    totalToken,
    inputCost,
    outputCost,
    totalCost,
    cumulativeTokens,
    cumulativeCost,
    responseTime,
    modelName,
    embededToken,
    embededCost,
  } = useContext(Context);
  return (
    <div className="actual-sidebar">
      {responseTime ? (
        <div className="token-and-cost-display">
          {/* insight heading and model name */}
          <div className="insight-and-modelName">
            <p>Insights</p>
            <p className="model-name">{selectedModel.value}</p>
          </div>

          {/* tokens used */}
          <div className="tokens">
            <p className="div-heading">Tokens</p>
            <div className="value-title">
              <div className="input-value">
                <span className="numeric-value">{inputToken}</span>
                <span className="char-value">Input Token</span>
              </div>
              <div className="output-values">
                <span className="numeric-value">{outputToken}</span>
                <span className="char-value">Output Token</span>
              </div>
              <div className="total-values">
                <span className="numeric-value">{totalToken}</span>
                <span className="char-value">Total Token</span>
              </div>
            </div>
          </div>

          {/* approx-cost */}
          <div className="approx-cost">
            <p className="div-heading">
              Approx Cost{" "}
              <span
                style={{ fontSize: "12px", fontWeight: "500", color: "grey" }}
              >
                (in USD)
              </span>
            </p>
            <div className="value-title">
              <div className="input-value">
                <span className="numeric-value">{inputCost}</span>
                <span className="char-value">Input Cost</span>
              </div>
              <div className="output-values">
                <span className="numeric-value">{outputCost}</span>
                <span className="char-value">Output Cost</span>
              </div>
              <div className="total-values">
                <span className="numeric-value">{totalCost}</span>
                <span className="char-value">Total Cost</span>
              </div>
            </div>
          </div>

          {/* embeded token */}
          <div className="embed-token">
            <p className="div-heading">Embeded Tokens / Cost</p>
            <div className="embed-value-title">
              <div className="input-value">
                <span className="numeric-value">{embededToken}</span>
                <span className="char-value">Embeded Token</span>
              </div>
              <div className="output-values">
                <span className="numeric-value">{embededCost}</span>
                <span className="char-value">Embeded Cost</span>
              </div>
            </div>
          </div>

          {/* cumulative cost and token */}
          <div className="cumulative-token-cost">
            <p className="div-heading">Cumulative Tokens / Cost</p>
            <div className="cumulative-value-title">
              <div className="input-value">
                <span className="numeric-value">{cumulativeTokens}</span>
                <span className="char-value ">Cumulative Tokens</span>
              </div>
              <div className="output-values">
                <span className="numeric-value">{cumulativeCost}</span>
                <span className="char-value">Cumulative Cost</span>
              </div>
            </div>
          </div>

          {/* response time and cost */}
          <div className="response-time-cost">
            <div className="response-time">
              <LuAlarmClockCheck />
              <span>Response time : {responseTime}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="skeleton-insight">
          <p className="shimmer-text">Getting Insights</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
