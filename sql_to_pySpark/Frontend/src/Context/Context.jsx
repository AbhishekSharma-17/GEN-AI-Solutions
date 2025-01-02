import { createContext, useState } from "react";

export const Context = createContext();

const ContextProvider = (props) => {

  // 
  const [sample, setSample] = useState();

  const ContextValue = {
    sample,
    setSample,
  };

  return (
    <Context.Provider value={ContextValue}>{props.children}</Context.Provider>
  )
};

export default ContextProvider;