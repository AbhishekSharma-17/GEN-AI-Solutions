import { createContext, useState } from "react";
export const Context = createContext();

const ContextProvider = (props) => {
  const [isLoadings, setIsLoadings] = useState(false);
  const [dbURI, setDBURI] = useState();
  const [API_KEY, setAPI_KEY] = useState();
  const [LLMType, setLLMType] = useState();
  const [error, setError] = useState("");

  const [connectedToDB, setConnectedToDB] = useState();
  const [dbSchema, setDbSchema] = useState("");

  // States for input, query, answer, loading, and error
  const [userQuestion, setUserQuestion] = useState(""); // To track the user's input
  const [query, setQuery] = useState(""); // To store the generated query
  const [answer, setAnswer] = useState(""); // To store the generated answer
  const [queryLoading, setQueryLoading] = useState(false);
  const [recentQuery, setRecentQuery] = useState([]);
  const [modelName, setModelName] = useState("");

  // tokens state
  const [inputToken, setInputToken] = useState("");
  const [outputToken, setOutputToken] = useState("");
  const [totalToken, setTotalToken] = useState("");

  // cost state
  const [inputCost, setInputCost] = useState("");
  const [outputCost, setOutputCost] = useState("");
  const [totalCost, setTotalCost] = useState("");

  const contextValue = {
    isLoadings,
    setIsLoadings,
    dbURI,
    setDBURI,
    API_KEY,
    setAPI_KEY,
    LLMType,
    setLLMType,
    connectedToDB,
    setConnectedToDB,
    error,
    setError,
    dbSchema,
    setDbSchema,
    userQuestion,
    setUserQuestion,
    query,
    setQuery,
    answer,
    setAnswer,
    queryLoading,
    setQueryLoading,
    recentQuery,
    setRecentQuery,
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
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};
export default ContextProvider;
