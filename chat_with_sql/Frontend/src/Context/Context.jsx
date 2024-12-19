import { createContext, useState } from "react";
export const Context = createContext();

const ContextProvider = (props) => {
  const [isLoadings, setIsLoadings] = useState(false);
  const [dbURI, setDBURI] = useState();
  const [API_KEY, setAPI_KEY] = useState();
  const [LLMType, setLLMType] = useState();
  const [error, setError] = useState('');

  const [connectedToDB, setConnectedToDB] = useState(false);
  const [dbSchema, setDbSchema] = useState('');

  const contextValue = {
    isLoadings,
    setIsLoadings,
    dbURI,
    setDBURI,
    API_KEY,
    setAPI_KEY,
    LLMType,
    setLLMType,
    connectedToDB, setConnectedToDB,
    error, setError,
    dbSchema, setDbSchema
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};
export default ContextProvider;
