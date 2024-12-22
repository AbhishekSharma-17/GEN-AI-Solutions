import React, { useContext } from "react";
import assets from "../../assets/assets";
import "./Sidebar.css";
import { Context } from "../../Context/Context";

const Sidebar = () => {
  const {
    recentQuery,
    dbURI,
    API_KEY,
    LLMType,
    setQuery,
    setAnswer,
    setQueryLoading,
    setError,
    setUserQuestion,
    modelName,
    setModelName,
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
    responseTime,
    setResponseTime,cumulativeTokens,
    setCumulativeTokens,
    cumulativeCost,
    setCumulativeCost,
  } = useContext(Context);

  const Database_URI = dbURI;
  const LLM_Type = LLMType;
  const API_Key = API_KEY;

  console.log("LLM-type: ", LLM_Type);

  const handleRecentQueryClick = async (question) => {
    setQuery("");
    setAnswer("");
    setInputToken("");
    setOutputToken("");
    setTotalToken("");
    setInputCost("");
    setOutputCost("");
    setTotalCost("");
    setResponseTime("");
    setQueryLoading(true);
    setUserQuestion(question);
    setError(null);

    if (LLM_Type === "OpenAI") {
      setModelName("gpt-4o");
    }
    if (LLM_Type === "Anthropic") {
      setModelName("claude-3-sonnet-20240229");
    }

    const form_data = {
      question: question,
      db_uri: Database_URI,
      llm_type: LLM_Type,
      model: modelName,
      api_key: API_Key,
      aws_access_key_id: "",
      aws_secret_access_key: "",
    };

    try {
      const response = await fetch("http://localhost:8001/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form_data),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch the query and answer.");
      }

      const data = await response.json();

      if (data.sql_query) {
        setQuery(data.sql_query);
      }

      if (data.answer) {
        setAnswer(data.answer);
      }
      setUserQuestion("");

      // Set token values as floats rounded to 2 decimal places
      if (data.input_tokens) {
        setInputToken(parseInt(data.input_tokens));
      }
      if (data.output_tokens) {
        setOutputToken(parseInt(data.output_tokens));
      }
      if (data.total_tokens) {
        setTotalToken(parseInt(data.total_tokens));
      }

      // Set cost values as floats rounded to 2 decimal places
      if (data.input_cost) {
        setInputCost(parseFloat(data.input_cost).toFixed(4));
      }
      if (data.output_cost) {
        setOutputCost(parseFloat(data.output_cost).toFixed(4));
      }
      if (data.total_cost) {
        setTotalCost(parseFloat(data.total_cost).toFixed(3));
      }

      if (data.cumulative_tokens) {
        setResponseTime(parseFloat(data.cumulative_tokens).toFixed(2));
      }
      if (data.cumulative_cost) {
        setResponseTime(parseFloat(data.cumulative_cost).toFixed(2));
      }
     
      if (data.cumulative_tokens) {
        setCumulativeTokens(parseFloat(data.cumulative_tokens).toFixed(2));
      }
      if (data.cumulative_cost) {
        setCumulativeCost(parseFloat(data.cumulative_cost).toFixed(2));
      }

      
      // response time
      let response_Time = "";
      if (data.response_time) {
        response_Time = parseFloat(data.response_time).toFixed(2);
        setResponseTime(response_Time);
        console.log("Response Time:", data.response_time);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        "An error occurred while processing your request. Please try again."
      );
    }

    setQueryLoading(false);
  };

  return (
    <div className="main-sidebar">
      {responseTime ? (
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

            {/* token per second starts */}
          <div
            style={{ padding: "10px", backgroundColor: "rgb(245, 245, 245)" }}
          >
            <p className="token-details-title">Cummulative </p>
            <div className="token-per-second">
              <div className="input-token-per-second">
                <span className="token-value">{cumulativeCost}</span>
                <span className="token-title">Cummulative Cost</span>
              </div>
              <div className="output-token-per-second">
                <span className="token-value">{cumulativeTokens}</span>
                <span className="token-title">Cummulative Token</span>
              </div>
            </div>
          </div>
          {/* token per second ends */}
          </div>
        </div>
      ) : null}

      <div className="main-sidebar-top">
        <p className="sidebar-top-title">Recent Queries</p>
        <div className="queries-list">
          {recentQuery.map((query, index) => (
            <div
              className="list-item"
              key={index}
              onClick={() => handleRecentQueryClick(query.question)}
            >
              <img src={assets.code_icon} alt="" />
              <p>{query.question}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="main-sidebar-bottom">
        <a href="https://www.genaiprotos.com/" target="blank">
          <img src={assets.genAILogo} alt="genAI-protos-logo" />
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
