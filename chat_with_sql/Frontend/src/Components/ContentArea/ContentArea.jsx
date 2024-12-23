import React, { useContext } from "react";
import "./ContentArea.css";
import Navbar from "../Navbar/Navbar";
import { Context } from "../../Context/Context";
import QueryLoader from "../QueryLoader/QueryLoader";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";

const ContentArea = () => {
  const {
    dbSchema,
    dbURI,
    API_KEY,
    LLMType,
    userQuestion,
    setUserQuestion,
    query,
    setQuery,
    answer,
    setAnswer,
    queryLoading,
    setQueryLoading,
    setError,
    setRecentQuery,
    setInputToken,
    setOutputToken,
    setTotalToken,
    setInputCost,
    setOutputCost,
    setTotalCost,
    setModelName,
    cumulativeTokens,
    setCumulativeTokens,
    cumulativeCost,
    setCumulativeCost,
    setResponseTime,
    thumbsUpActive,
    setThumbsUpActive,
    thumbsDownActive,
    setThumbsDownActive,
  } = useContext(Context);

  const Database_URI = dbURI;
  const LLM_Type = LLMType;
  const API_Key = API_KEY;

  const handleQuery = async (e) => {
    e.preventDefault();

    // Reset thumbs-up and thumbs-down states
    setThumbsUpActive(false);
    setThumbsDownActive(false);

    setQuery("");
    setAnswer("");
    setInputToken("");
    setOutputToken("");
    setTotalToken("");
    setInputCost("");
    setOutputCost("");
    setTotalCost("");
    setResponseTime("");
    setCumulativeTokens("");
    setCumulativeCost("");
    setError(null);
    setQueryLoading(true);

    // Set the model name based on LLM_Type, use a local variable to avoid async issues
    let updatedModelName = "";

    if (LLM_Type === "OpenAI") {
      updatedModelName = "gpt-4o";
      setModelName("gpt-4o");
    }
    if (LLM_Type === "Anthropic") {
      updatedModelName = "claude-3-sonnet-20240229";
      setModelName("claude-3-sonnet-20240229");
    }

    const form_data = {
      question: userQuestion,
      db_uri: Database_URI,
      llm_type: LLM_Type,
      model: updatedModelName,
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
      setUserQuestion("");

      if (data.sql_query) {
        setQuery(data.sql_query);
      }

      if (data.answer) {
        setAnswer(data.answer);
      }

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
      if (data.response_time) {
        setResponseTime(parseFloat(data.response_time).toFixed(2));
      }

      if (data.cumulative_tokens) {
        setCumulativeTokens(parseFloat(data.cumulative_tokens).toFixed(2));
      }
      if (data.cumulative_cost) {
        setCumulativeCost(parseFloat(data.cumulative_cost).toFixed(2));
      }

      // Update recent queries
      setRecentQuery((prevRecentQueries) => [
        { question: userQuestion, query: data.sql_query, answer: data.answer },
        ...prevRecentQueries,
      ]);
    } catch (error) {
      // console.error("Error:", error);
      setError(
        "An error occurred while processing your request. Please try again."
      );
    }

    setQueryLoading(false);
  };

  // handling like button click
  const handleLikeClick = () => {
    console.log("Liked button click");
    setThumbsUpActive(true);
    setThumbsDownActive(false);
  };

  // handling dislike button click
  const handleDislikeClick = () => {
    console.log("DisLike button click");
    setThumbsUpActive(false);
    setThumbsDownActive(true);
  };

  return (
    <div className="content-Area">
      <Navbar />
      <div className="database-schema">
        <p>Database Schema</p>
        <div className="schema">
          <pre>{dbSchema}</pre>
        </div>
      </div>

      <div className="schema-question-answers">
        <div className="schema-question">
          <p>Question</p>
          <form className="mt-3 mb-3 mySchemaForm" onSubmit={handleQuery}>
            <input
              type="text"
              placeholder="Ask Questions about your database."
              className="form-control p-2"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-dark query-btn p-2"
              disabled={queryLoading}
            >
              {queryLoading ? "Loading..." : "Submit Query"}
            </button>
          </form>
        </div>

        <div className="answers-query">
          {queryLoading ? (
            <div className="query-loader">
              <QueryLoader />
            </div>
          ) : (
            <>
              {query && (
                <div className="schema-generated-query">
                  <p>Generated SQL Query</p>
                  <div className="query mt-3 mb-3">
                    {query || "Waiting for generated query..."}
                  </div>
                </div>
              )}
              {answer && (
                <div className="schema-answers">
                  <p>Answer</p>
                  <div className="answer mt-3 mb-3">
                    {answer || "Waiting for answer..."}
                  </div>
                  <div className="like-dislike mb-3">
                    <FaThumbsUp
                      id="Icon"
                      onClick={handleLikeClick}
                      className={thumbsUpActive ? "green-class" : ""}
                      // className="green"
                    />
                    <FaThumbsDown
                      id="Icon"
                      onClick={handleDislikeClick}
                      className={thumbsDownActive ? "red-class" : ""}
                      // className="redd-class"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentArea;
