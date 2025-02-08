import { createContext, useRef, useState } from "react";

export const HomeContext = createContext();

const HomeProvider = (props) => {
  const [LLMType, setLLMType] = useState(""); // LLM type setting
  const [API_KEY, setAPI_KEY] = useState(""); // API_KEY setting
  const [groq_API_KEY, setGroq_API_KEY] = useState(""); // unstructured API_KEY setting

  const form_LLM_type = useRef(null); // form  LLM type
  const form_API_Key = useRef(null); // form API_key
  const form_Groq_API_Key = useRef(null); // form API_key

  const contextValue = {
    LLMType,
    setLLMType,
    form_LLM_type,
    form_API_Key,
    API_KEY,
    setAPI_KEY,
    form_Groq_API_Key,
    groq_API_KEY,
    setGroq_API_KEY,
  };

  return (
    <HomeContext.Provider value={contextValue}>
      {props.children}
    </HomeContext.Provider>
  );
};

export default HomeProvider;
