import { createContext, useRef, useState } from "react";

export const HomeContext = createContext();

const HomeProvider = (props) => {
  const [LLMType, setLLMType] = useState(""); // LLM type setting
  const [API_KEY, setAPI_KEY] = useState('') // API_KEY setting 
  const [unstructured_API_KEY, setUnstructured_API_KEY] = useState('') // unstructured API_KEY setting 
  const [isLoadings, setIsLoadings] = useState(false); //state for loader
  const form_LLM_type = useRef(null); // form  LLM type
  const form_API_Key = useRef(null); // form API_key
  const form_Unstructured_API_Key = useRef(null); // form API_key

  const contextValue = {
    LLMType,
    setLLMType,
    isLoadings,
    setIsLoadings,
    form_LLM_type,
    form_API_Key,
    API_KEY, setAPI_KEY,
    form_Unstructured_API_Key,
    unstructured_API_KEY, setUnstructured_API_KEY,
  };

  return (
    <HomeContext.Provider value={contextValue}>
      {props.children}
    </HomeContext.Provider>
  );
};

export default HomeProvider;
