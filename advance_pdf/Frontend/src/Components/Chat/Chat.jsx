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

  const { fileResponse, setFileResponse, initialQueries } = useContext(Context);

  console.log("Initial Queries Resposne: ", initialQueries);
  return (
    <div className="chat-section">
      <div className="chat-section-title">
        <p>Chat</p>
        <p>X</p>
      </div>
      <div className="main-chat">
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
      </div>

      <form className="chat-inputs">
        <div className="chat-input-field">
          <input
            type="email"
            class="form-control"
            id="input-query"
            placeholder="Ask here !!"
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
