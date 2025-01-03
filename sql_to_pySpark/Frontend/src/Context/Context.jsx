import { createContext, useState } from "react";

export const Context = createContext();

const ContextProvider = (props) => {
  // provider
  const [selectedProvider, setSelectedProvider] = useState();

  // uploaded file
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // API Key
  const [apiKey, setApiKey] = useState("");

  // Conversion Result
  const [conversionResults, setConversionResults] = useState([]);

  // loading state
  const [loading, setLoading] = useState(false);

  // model Option
  const [modelOption, setModelOption] = useState([]);

  // setting model
  const [model, setModel] = useState("");

  const ContextValue = {
    selectedProvider,
    setSelectedProvider,
    uploadedFiles,
    setUploadedFiles,
    apiKey,
    setApiKey,
    conversionResults,
    setConversionResults,
    loading,
    setLoading,
    modelOption,
    setModelOption,
    model,
    setModel,
  };

  return (
    <Context.Provider value={ContextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
