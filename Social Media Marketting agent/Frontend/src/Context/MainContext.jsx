import { createContext, useRef, useState } from "react";

export const MainContext = createContext();

const MainProvider = (props) => {
  const platformRef = useRef();
  const [platformSelected, setPlatformSelected] = useState("");
  const [platformToView, setPlatformToView] = useState("");
  const [caption, setCaption] = useState("");

  const contextValue = {
    platformRef,
    platformSelected,
    setPlatformSelected,
    platformToView,
    setPlatformToView,
    caption,
    setCaption,
  };

  return (
    <MainContext.Provider value={contextValue}>
      {props.children}
    </MainContext.Provider>
  );
};

export default MainProvider;
