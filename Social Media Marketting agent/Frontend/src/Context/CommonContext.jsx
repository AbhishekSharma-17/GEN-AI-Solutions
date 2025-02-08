import { createContext, useRef, useState } from "react";

export const CommonContext = createContext();

const CommonProvider = (props) => {
 const [error, setError] = useState('')
 const [isLoadings, setIsLoadings] = useState(false); //state for loader

  const contextValue = {
    error, setError,
    isLoadings, setIsLoadings
  };

  return (
    <CommonContext.Provider value={contextValue}>
      {props.children}
    </CommonContext.Provider>
  );
};

export default CommonProvider;
