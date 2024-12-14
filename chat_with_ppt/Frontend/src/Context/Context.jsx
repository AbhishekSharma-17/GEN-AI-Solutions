import { createContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';

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

  // taking APIprovider, ProviderKey, and unstructured key
  const [apiProvider, setAPIProvider] = useState();
  const [providerKey, setProviderKey] = useState();
  const [unstructuredKey, setUnstructuredKey] = useState();

  // JAB RESponse aayega to konse provider ka multi model chalana hai 
  const [reponseProvider, setResponseProvider] = useState(); // isko multi model ko choose krne k liye use krna hai

  // state for initialisation status
  const [initialisationStatus, setInitialisationStatus] = useState(false); // if this is true then it will display loading animation
  
  // New state for unique user ID
  const [userId, setUserId] = useState(null);

  // Generate unique user ID on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      const newUserId = uuidv4();
      setUserId(newUserId);
      localStorage.setItem('userId', newUserId);
    }
  }, []);

  const contextValue = {
    initialisationStatus, setInitialisationStatus,
    reponseProvider, setResponseProvider,
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
    fileUploaded,
    setFileUploaded,
    userId, // Add userId to context
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
