import { createContext, useState } from "react";

export const Context = createContext();

const ContextProvider = (props) => {
  // provider
  const [selectedProvider, setSelectedProvider] = useState();

  const ContextValue = {
    selectedProvider,
    setSelectedProvider,
  };

  return (
    <Context.Provider value={ContextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
