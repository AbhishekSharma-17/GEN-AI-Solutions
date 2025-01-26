import React, { createContext, useState } from "react";

export const Context = createContext();

export const ContextProvider = ({ children }) => {
  const [file, setFile] = useState(null); // State to hold the uploaded file

  return (
    <Context.Provider value={{ file, setFile }}>
      {children}
    </Context.Provider>
  );
};
