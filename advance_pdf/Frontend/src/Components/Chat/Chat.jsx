import React from "react";
import "./Chat.css";
import { BsFillSendFill } from "react-icons/bs";
import { Context } from "../../Context/Context";
import { useContext } from "react";
import assets from "../../assets/assets";

const Chat = () => {
  const images = [
    assets.bulb_icon,
    assets.compass_icon,
    assets.history_icon,
    assets.message_icon,
  ];

  const handleHorizontalScroll = (event) => {
    const container = event.currentTarget;
    container.scrollLeft += event.deltaY; // Scroll horizontally based on vertical wheel movement
    event.preventDefault(); // Prevent the default vertical scrolling behavior
  };

  const {
    fileResponse,
    setFileResponse,
    initialQueries,
    showResult,
    setShowResult,
    setInput,
    setInputToken,
    setOutputToken,
    setTotalToken,
    setInputCost,
    setOutputCost,
    setTotalCost,
    setCumulativeTokens,
    setCumulativeCost,
    setResponseTime,
  } = useContext(Context);

  console.log("Initial Queries Resposne: ", initialQueries);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!input) return;

    try {
      setShowResult(true);
      setLoadings(true);
      setRecentPrompt(input);
      setEmbededCost("");
      setEmbededToken("");
      setInputToken("");
      setOutputToken("");
      setTotalToken("");
      setInputCost("");
      setOutputCost("");
      setTotalCost("");
      setCumulativeTokens("");
      setCumulativeCost("");
      setResponseTime("");

      const loaderIndex = chatHistory.length;
      setChatHistory((prev) => [
        ...prev,
        { type: "user", text: input },
        { type: "bot", text: "", loading: true },
      ]);

      setInput("");

      const modelToUse = selectedModel
        ? selectedModel.value
        : responseProvider === "openai"
        ? "gpt-4o-mini"
        : "gemini-1.5-flash";
      setModelName(modelToUse);

      const res = await fetch(
        `http://localhost:8000/chat?user_id=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: input,
            provider: responseProvider,
            model: modelToUse,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch response from the server.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;

        // Update chat history with partial response
        const textOnly = accumulatedResponse.split("{")[0].trim(); // Extract main response text
        setChatHistory((prev) =>
          prev.map((chat, index) =>
            index === loaderIndex + 1
              ? { ...chat, text: textOnly, loading: false }
              : chat
          )
        );
      }

      // Extract metadata (JSON) after the main response text
      const metadataStart = accumulatedResponse.indexOf("{");
      const metadata =
        metadataStart !== -1
          ? JSON.parse(accumulatedResponse.slice(metadataStart))
          : {};

      // Set response text
      const textResponse = accumulatedResponse.split("{")[0].trim();
      setResponse(textResponse);
      setPreviousPrompt((prev) => [...prev, input]);

      // Update state with metadata
      if (metadata) {
        setInputToken(parseInt(metadata.input_tokens) || 0);
        setOutputToken(parseInt(metadata.output_tokens) || 0);
        setTotalToken(parseInt(metadata.total_tokens) || 0);
        setInputCost(parseFloat(metadata.input_cost).toFixed(5) || 0);
        setOutputCost(parseFloat(metadata.output_cost).toFixed(5) || 0);
        setTotalCost(parseFloat(metadata.total_cost).toFixed(5) || 0);
        setCumulativeTokens(parseInt(metadata.cumulative_tokens) || 0);
        setCumulativeCost(parseFloat(metadata.cumulative_cost).toFixed(3) || 0);
        setResponseTime(parseFloat(metadata.response_time).toFixed(2) || 0);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = "An error occurred. Please try again.";
      setResponse(errorMessage);
      setChatHistory((prev) =>
        prev.map((chat, index) =>
          index === loaderIndex + 1
            ? { ...chat, text: errorMessage, loading: false }
            : chat
        )
      );
    } finally {
      setLoadings(false);
    }
  };

  return (
    <div className="chat-section">
      <div className="chat-section-title">
        <p>Chat</p>
        <p>X</p>
      </div>
      <div className="main-chat">
        {showResult ? null : (
          <div className="main-chat-query">
            <div className="queries" onWheel={handleHorizontalScroll}>
              {initialQueries.map((query, index) => (
                <div className="query" key={index}>
                  <p>{query}</p>
                  <img src={images[index]} width="20" alt="" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        className="chat-inputs"
        onSubmit={handleSend}
        style={{ border: "1px solid green" }}
      >
        <div className="chat-input-field">
          <input
            type="email"
            class="form-control"
            id="input-query"
            placeholder="Ask here !!"
            onChange={(event) => setInput(event.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-dark">
          <BsFillSendFill />
        </button>
      </form>
    </div>
  );
};

export default Chat;
