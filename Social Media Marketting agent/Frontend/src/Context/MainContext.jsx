import { createContext, useRef, useState } from "react";

export const MainContext = createContext();

const MainProvider = (props) => {
  const platformRef = useRef();
  const [platformSelected, setPlatformSelected] = useState("");
  const [platformToView, setPlatformToView] = useState("");
  const [caption, setCaption] = useState("");
  const [local_url, setLocalURL] = useState('');
  const [file, setFile] = useState(null)
  const [backendStatus, setBackendStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false);
  const [mediaInfo, setMediaInfo] = useState({ file_path: null, media_url: null });
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [mediaURL, setMediaURL] = useState('')
  const [uploadedFilePath, setUploadedFilePath] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const contextValue = {
    platformRef,
    platformSelected,
    setPlatformSelected,
    platformToView,
    setPlatformToView,
    caption,
    setCaption,
    local_url, setLocalURL,
    file, setFile,
    backendStatus, setBackendStatus,
    isUploading, setIsUploading,
    mediaInfo, setMediaInfo,
    uploadCompleted, setUploadCompleted,
    mediaURL, setMediaURL,
    uploadedFilePath, setUploadedFilePath,
    isAnalyzing, setIsAnalyzing,
  };

  return (
    <MainContext.Provider value={contextValue}>
      {props.children}
    </MainContext.Provider>
  );
};

export default MainProvider;
