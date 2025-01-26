import { createContext, useRef, useState } from "react";

export const CommonContext = createContext();

const CommonProvider = (props) => {
 const [error, setError] = useState('')

  const contextValue = {
    error, setError,
  };

  return (
    <CommonContext.Provider value={contextValue}>
      {props.children}
    </CommonContext.Provider>
  );
};

export default CommonProvider;
