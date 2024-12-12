import { createContext, useState } from "react";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState(""); // to save input data
  const [recentPrompt, setRecentPrompt] = useState(""); // to save recent
  const [previousPrompt, setPreviousPrompt] = useState([]); // to save previous
  const [showResult, setShowResult] = useState(false); // to show results if it is true, then it will hide greet on the basis of it
  const [loadings, setLoadings] = useState(false); // if this is true then it will display loading animation
  const [resultData, setResultData] = useState(""); // used to display result on web page

  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileResponse, setFileResponse] = useState(false);
  const [response, setResponse] = useState(""); // user query response
  const [queries, setQueries] = useState([{}]);

  const contextValue = {
    previousPrompt,
    setPreviousPrompt, // Corrected here
    setRecentPrompt,
    recentPrompt,
    input,
    setInput,
    showResult,
    setShowResult,
    loadings,
    setLoadings,
    resultData,
    setResultData,
    fileResponse,
    setFileResponse,
    response,
    setResponse,
    queries,
    setQueries,
    fileUploaded,
    setFileUploaded,
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;