import React, { useContext } from "react";
import "./MainPage.css";
import Sidebar from "../../Components/Sidebar/Sidebar";
import ContentArea from "../../Components/ContentArea/ContentArea";
import { Context } from "../../Context/Context";
import assets from "../../assets/assets";

const MainPage = () => {
  const { LLMType } = useContext(Context);

  let LLMType_modelName = [];

  if (LLMType === "OpenAI") {
    LLMType_modelName = [
      { name: "gpt-4o", image: assets.chatGPTIcon },
      { name: "gpt-4o-mini", image: assets.chatGPTIcon },
    ];
  } else if (LLMType === "Anthropic") {
    LLMType_modelName = [
      { name: "claude-3-5-sonnet-20241022", image: assets.anthropic },
      { name: "claude-3-5-haiku-20241022", image: assets.anthropic },
    ];
  } else if (LLMType === "Groq") {
    LLMType_modelName = [
      { name: "llama-3.3-70b-versatile", image: assets.groq },
      { name: "gemma2-9b-it", image: assets.groq },
    ];
  }

  return (
    <div className="main-page">
      <Sidebar />
      <ContentArea LLMType_modelName={LLMType_modelName} />
    </div>
  );
};

export default MainPage;
