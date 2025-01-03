import { createContext, useState } from "react";

export const Context = createContext();

const ContextProvider = (props) => {
  // provider
  const [selectedProvider, setSelectedProvider] = useState();

  // uploaded file
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // model choice
  const [providerChoice, setProviderChoice] = useState("ChatGPT");

  // API Key
  const [apiKey, setApiKey] = useState("");

  // modelName
  const [modelName, setModelName] = useState("");

  // Conversion Result
  const [conversionResults, setConversionResults] = useState([]);

  // loading state
  const [loading, setLoading] = useState(false);

  const ContextValue = {
    selectedProvider,
    setSelectedProvider,
    uploadedFiles,
    setUploadedFiles,
    providerChoice,
    setProviderChoice,
    apiKey,
    setApiKey,
    modelName,
    setModelName,
    conversionResults,
    setConversionResults,
    loading,
    setLoading,
  };

  return (
    <Context.Provider value={ContextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
