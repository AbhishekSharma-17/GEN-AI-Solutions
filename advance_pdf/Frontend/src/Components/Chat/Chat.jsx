import React from "react";
import "./Chat.css";
import { BsFillSendFill } from "react-icons/bs";

const Chat = () => {
  return (
    <div className="chat-section">
      <div className="chat-section-title">
        <p>Chat</p>
        <p>X</p>
      </div>
      <div className="main-chat"></div>

      <div className="chat-inputs">
        <div className="chat-input-field">
          <input
            type="email"
            class="form-control"
            id="input-query"
            placeholder="Ask here !!"
          />

        </div>
          <button type="submit" className="btn btn-dark"><BsFillSendFill/></button>
      </div>
    </div>
  );
};

export default Chat;
