import { createContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

export const Context = createContext();

const ContextProvider = (props) => {
  // home page contect
  // taking APIprovider, ProviderKey, and unstructured key
  const [apiProvider, setAPIProvider] = useState();
  const [providerKey, setProviderKey] = useState();
  const [unstructuredKey, setUnstructuredKey] = useState();
  const [file, setLocalFile] = useState(null);

  // main page context
  // upload hua ya nhi (upload and embedding endpoint)
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(null); // New state for unique user ID
  const [filepath, setFilePath] = useState(""); // setting file path
  const [embededComplete, setIsEmbedComplete] = useState(false);
  const [fileResponse, setFileResponse] = useState({}); // setting response coming from embedding endpoint , complete response hai

  // setting queries
  const [initialQueries, setInitialQueries] = useState([]);

  const[showReview, setShowReview] = useState(false)

  const [chatHistory, setChatHistory] = useState([]);
  const [input, setInput] = useState(""); // to save input data
  const [recentPrompt, setRecentPrompt] = useState(""); // to save recent
  const [previousPrompt, setPreviousPrompt] = useState([]); // to save previous
  const [showResult, setShowResult] = useState(false); // to show results if it is true, then it will hide greet on the basis of it
  const [loadings, setLoadings] = useState(false); // if this is true then it will display loading animation
  const [resultData, setResultData] = useState(""); // used to display result on web page

  const [response, setResponse] = useState(""); // user query response

  const [queries, setQueries] = useState([{}]);

  // modelName
  const [modelName, setModelName] = useState("");

  // image count
  const [imageCount, setImageCount] = useState(0);
  // table count
  const [tableCount, setTableCount] = useState(0);

  // JAB RESponse aayega to konse provider ka multi model chalana hai
  const [responseProvider, setResponseProvider] = useState(); // isko multi model ko choose krne k liye use krna hai

  // state for initialisation status
  const [initialisationStatus, setInitialisationStatus] = useState(false); // if this is true then it will display loading animation

  const [selectedModel, setSelectedModel] = useState("");

  // tokens state
  const [inputToken, setInputToken] = useState("");
  const [outputToken, setOutputToken] = useState("");
  const [totalToken, setTotalToken] = useState("");

  // cost state
  const [inputCost, setInputCost] = useState("");
  const [outputCost, setOutputCost] = useState("");
  const [totalCost, setTotalCost] = useState("");

  // cummulative tokens and cost
  const [cumulativeTokens, setCumulativeTokens] = useState("");
  const [cumulativeCost, setCumulativeCost] = useState("");

  // response time of query
  const [responseTime, setResponseTime] = useState("");

  // embeded tokens and cost state
  const [embededToken, setEmbededToken] = useState("");
  const [embededCost, setEmbededCost] = useState("");

  // response cost
  const [totalResponseCost, setTotalResponseCost] = useState("");

  // Generate unique user ID on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = uuidv4();
      setUserId(newUserId);
      localStorage.setItem("userId", newUserId);
    }
  }, []);

  const contextValue = {
    showReview, setShowReview,
    selectedModel, setSelectedModel,
    imageCount,
    setImageCount,
    tableCount,
    setTableCount,
    chatHistory,
    setChatHistory,
    filepath,
    setFilePath,
    uploading,
    setUploading,
    file,
    setLocalFile,
    embededComplete,
    setIsEmbedComplete,
    initialQueries,
    setInitialQueries,

    // here to upwards new state are defined
    initialisationStatus,
    setInitialisationStatus,
    responseProvider,
    setResponseProvider,
    apiProvider,
    setAPIProvider,
    providerKey,
    setProviderKey,
    unstructuredKey,
    setUnstructuredKey,
    previousPrompt,
    setPreviousPrompt,
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

    userId, // Add userId to context
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
    cumulativeTokens,
    setCumulativeTokens,
    cumulativeCost,
    setCumulativeCost,
    responseTime,
    setResponseTime,
    modelName,
    setModelName,
    embededToken,
    setEmbededToken,
    embededCost,
    setEmbededCost,
    totalResponseCost,
    setTotalResponseCost,
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
