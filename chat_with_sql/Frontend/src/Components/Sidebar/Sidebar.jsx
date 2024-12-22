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
  } = useContext(Context);

  const Database_URI = dbURI;
  const LLM_Type = LLMType;
  const API_Key = API_KEY;

  const handleRecentQueryClick = async (question) => {
    setQuery("");
    setAnswer("");
    setQueryLoading(true);
    setUserQuestion(question);
    setError(null);

    const form_data = {
      question: question,
      db_uri: Database_URI,
      llm_type: LLM_Type,
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
      {/* token display starts here */}
      <div className="token-display">
        <div className="latency">
          <p>Latency :</p>
        </div>
        <div className="tokens">
          <p>Tokens :</p>
        </div>

        {/* hover content starts here */}
        <div class="hover-content">
          <div className="speed-insights">
            <p>Speed Insights</p>
          </div>

          {/*input output token starts   */}
          <div style={{ padding: "10px" }}>
            <p className="token-details-title">Tokens </p>
            <div className="input-output-token">
              <div className="input-token">
                <span className="token-value">51</span>
                <span className="token-title">Input token</span>
              </div>
              <div className="output-token">
                <span className="token-value">49</span>
                <span className="token-title">Output token</span>
              </div>
              <div className="total-token">
                <span className="token-value">100</span>
                <span className="token-title">Total token</span>
              </div>
            </div>
          </div>
          {/*  input out token end*/}
          {/* inference starts  */}
          <div style={{ padding: "10px" }}>
            <p className="token-details-title">Inference Time </p>
            <div className="inference-time">
              <div className="input-inference">
                <span className="token-value">51</span>
                <span className="token-title">Input seconds</span>
              </div>
              <div className="output-inference">
                <span className="token-value">49</span>
                <span className="token-title">Output seconds</span>
              </div>
              <div className="total-inference">
                <span className="token-value">100</span>
                <span className="token-title">Total seconds</span>
              </div>
            </div>
          </div>
          {/*  inference ends*/}
          {/* token per second starts */}
          <div
            style={{ padding: "10px", backgroundColor: "rgb(245, 245, 245)" }}
          >
            <p className="token-details-title">Token / Seconds </p>
            <div className="token-per-second">
              <div className="input-token-per-second">
                <span className="token-value">51</span>
                <span className="token-title">Input seconds</span>
              </div>
              <div className="output-token-per-second">
                <span className="token-value">49</span>
                <span className="token-title">Output seconds</span>
              </div>
              <div className="total-token-per-second">
                <span className="token-value">100</span>
                <span className="token-title">Total seconds</span>
              </div>
            </div>
          </div>
          {/* token per second ends */}
        </div>
      </div>
      {/* token display ends here */}
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
