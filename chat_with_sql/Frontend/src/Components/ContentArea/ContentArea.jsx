import React, { useContext } from "react";
import "./ContentArea.css";
import Navbar from "../Navbar/Navbar";
import { Context } from "../../Context/Context";
import QueryLoader from "../QueryLoader/QueryLoader";

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
  } = useContext(Context);

  const Database_URI = dbURI;
  const LLM_Type = LLMType;
  const API_Key = API_KEY;

  const handleQuery = async (e) => {
    e.preventDefault();
    setQuery("");
    setAnswer("");
    setInputToken("");
    setOutputToken("");
    setTotalToken("");
    setInputCost("");
    setOutputCost("");
    setTotalCost("");
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

      // Update tokens and costs
      setInputToken(data.input_tokens || 0);
      setOutputToken(data.output_tokens || 0);
      setTotalToken(data.total_tokens || 0);

      setInputCost(data.input_cost || 0);
      setOutputCost(data.output_cost || 0);
      setTotalCost(data.total_cost || 0);

      // Update recent queries
      setRecentQuery((prevRecentQueries) => [
        { question: userQuestion, query: data.sql_query, answer: data.answer },
        ...prevRecentQueries,
      ]);
    } catch (error) {
      console.error("Error:", error);
      setError(
        "An error occurred while processing your request. Please try again."
      );
    }

    setQueryLoading(false);
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
