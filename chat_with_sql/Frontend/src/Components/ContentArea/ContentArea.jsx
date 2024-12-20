import React, { useContext, useState } from "react";
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
  } = useContext(Context);

  // Replace with your actual values for these variables
  const Database_URI = dbURI; // Example placeholder
  const LLM_Type = LLMType; // Example placeholder
  const API_Key = API_KEY; // Example placeholder

  const handleQuery = async (e) => {
    e.preventDefault(); // Prevent form submission
    setQuery(""); // Clear previous query
    setAnswer(""); // Clear previous answer
    setError(null);
    setQueryLoading(true);

    // Prepare form_data to send to the API
    const form_data = {
      question: userQuestion,
      db_uri: Database_URI,
      llm_type: LLM_Type,
      api_key: API_Key,
      aws_access_key_id: "", // Add actual values if needed
      aws_secret_access_key: "", // Add actual values if needed
    };

    try {
      const response = await fetch("http://localhost:8001/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form_data), // Send the form_data as JSON
      });

      // Check if the response is valid
      if (!response.ok) {
        throw new Error("Failed to fetch the query and answer.");
      }

      const data = await response.json(); // Wait for the entire response
      setUserQuestion(""); // Clear the user input after the query is made

      // Set the query and answer from the response
      if (data.sql_query) {
        setQuery(data.sql_query);
      }

      if (data.answer) {
        setAnswer(data.answer);
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
    <div className="content-Area">
      <Navbar />
      {/* Database schema starts */}
      <div className="database-schema">
        <p>Database Schema</p>
        <div className="schema">
          {/* Use a <pre> tag to preserve formatting */}
          <pre>{dbSchema}</pre>
        </div>
      </div>
      {/* Database schema ends */}

      {/* question-answers starts here */}
      <div className="schema-question-answers">
        <div className="schema-question">
          <p>Question</p>
          <form className="mt-3 mb-3 mySchemaForm" onSubmit={handleQuery}>
            <input
              type="text"
              placeholder="Ask Questions about your database."
              className="form-control p-2"
              value={userQuestion} // Controlled input
              onChange={(e) => setUserQuestion(e.target.value)} // Update state
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

        {/* Only display answers-query if query or answer exists */}

        <div className="answers-query">
          {queryLoading ? (
            <div className="query-loader"><QueryLoader /></div>
          ) : (
            <>
              {query ? (
                <div className="schema-generated-query">
                  <p>Generated SQL Query</p>
                  <div className="query mt-3 mb-3">
                    {query || "Waiting for generated query..."}
                  </div>
                </div>
              ) : null}
              {answer ? (
                <div className="schema-answers">
                  <p>Answer</p>
                  <div className="answer mt-3 mb-3">
                    {answer || "Waiting for answer..."}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      {/* question-answers ends here */}
    </div>
  );
};

export default ContentArea;
