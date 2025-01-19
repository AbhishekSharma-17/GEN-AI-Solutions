import React, { useContext, useState } from "react";
import "./ContentArea.css";
import Navbar from "../Navbar/Navbar";
import { Context } from "../../Context/Context";
import QueryLoader from "../QueryLoader/QueryLoader";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ContentArea = ({ LLMType_modelName }) => {
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
    modelName,
    setCumulativeTokens,
    setCumulativeCost,
    setResponseTime,
    thumbsUpActive,
    setThumbsUpActive,
    thumbsDownActive,
    setThumbsDownActive,
    questionForNoice,
    setQuestionForNoice,
  } = useContext(Context);

  const [displayThumbDown, setDisplayThumbDown] = useState(true);
  const [displayThumbUp, setDisplayThumbUp] = useState(true);

  const handleQuery = async (e) => {
    e.preventDefault();

    // Reset thumbs and query states
    resetState();

    if (modelName === "") {
      toast.error("Please select a model before submitting the query.");
      return;
    }

    setQuestionForNoice(userQuestion);

    const form_data = {
      question: userQuestion,
      db_uri: dbURI,
      llm_type: LLMType,
      model: modelName,
      api_key: API_KEY,
      aws_access_key_id: "",
      aws_secret_access_key: "",
    };

    try {
      setQueryLoading(true);
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

      if (data.sql_query) setQuery(data.sql_query);
      if (data.answer) setAnswer(data.answer);

      // Set token and cost values
      if (data.input_tokens) setInputToken(parseInt(data.input_tokens));
      if (data.output_tokens) setOutputToken(parseInt(data.output_tokens));
      if (data.total_tokens) setTotalToken(parseInt(data.total_tokens));
      if (data.input_cost) setInputCost(parseFloat(data.input_cost).toFixed(4));
      if (data.output_cost) setOutputCost(parseFloat(data.output_cost).toFixed(4));
      if (data.total_cost) setTotalCost(parseFloat(data.total_cost).toFixed(3));
      if (data.response_time) setResponseTime(parseFloat(data.response_time).toFixed(2));
      if (data.cumulative_tokens) setCumulativeTokens(parseFloat(data.cumulative_tokens).toFixed(2));
      if (data.cumulative_cost) setCumulativeCost(parseFloat(data.cumulative_cost).toFixed(2));

      setRecentQuery((prevRecentQueries) => [
        { question: userQuestion, query: data.sql_query, answer: data.answer },
        ...prevRecentQueries,
      ]);
    } catch (error) {
      setError("An error occurred while processing your request. Please try again.");
      console.error("Error:", error);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleLikeClick = async () => {
    console.log("Liked button clicked");
    setThumbsUpActive(true);
    setThumbsDownActive(false);
    setDisplayThumbDown(false);

    const payload = {
      noice: true,
      output: query,
      input: dbSchema + "\n\nQuestion: " + questionForNoice,
    };

    try {
      const response = await fetch("http://localhost:8001/noice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Failed to send request:", response.status);
      }
    } catch (error) {
      console.error("Error occurred while sending request:", error);
    }
  };

  const handleDislikeClick = () => {
    console.log("Disliked button clicked");
    setThumbsUpActive(false);
    setThumbsDownActive(true);
    setDisplayThumbUp(false);
  };

  const resetState = () => {
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
    setDisplayThumbDown(true);
    setDisplayThumbUp(true);
    setThumbsDownActive(false)
    setThumbsUpActive(false)
  };

  return (
    <div className="content-Area">
      <Navbar LLMType_modelName={LLMType_modelName} setModelName={setModelName} />
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
              Submit Query
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
                  <div className="query mt-3">{query || "Waiting for generated query..."}</div>
                  <div className="like-dislike mb-3">
                    <FaThumbsUp
                      id="Icon"
                      onClick={handleLikeClick}
                      className={thumbsUpActive ? "green-class" : ""}
                      style={{ display: displayThumbUp ? "block" : "none" }}
                    />
                    <FaThumbsDown
                      id="Icon"
                      onClick={handleDislikeClick}
                      className={thumbsDownActive ? "red-class" : ""}
                      style={{ display: displayThumbDown ? "block" : "none" }}
                    />
                  </div>
                </div>
              )}
              {answer && (
                <div className="schema-answers">
                  <p>Answer</p>
                  <div className="answer mt-3">{answer || "Waiting for answer..."}</div>
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
