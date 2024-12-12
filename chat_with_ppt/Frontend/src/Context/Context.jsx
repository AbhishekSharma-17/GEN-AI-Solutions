import { createContext, useState } from "react";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState(""); // to save input data
  const [recentPrompt, setRecentPrompt] = useState(""); // to save recent
  const [previousPrompt, setPreviousprompt] = useState([]); // to save previous
  const [showResult, setShowResult] = useState(false); // to show results if it is true, then it will hide greet on the basis of it
  const [loadings, setLoadings] = useState(false); // if this is true then it will display loading animation
  const [resultData, setResultData] = useState(""); // used to display result on we page

  const [fileUploaded, setFileUploaded] = useState(false);

  const [fileResponse, setFileResponse] = useState(false);

  const contextValue = {
    previousPrompt,
    setPreviousprompt,
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
  };
  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
