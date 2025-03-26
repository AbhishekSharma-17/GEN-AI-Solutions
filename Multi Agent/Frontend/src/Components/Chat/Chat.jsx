import "./Chat.css";
import { IoChatbox } from "react-icons/io5";
import { IoSend } from "react-icons/io5";

const Chat = () => {
  return (
    <div className="chat-section">
      <div className="message">{/* <p>lfhegjk</p> */}</div>
      <div className="input-section">
        <form>
          <input
            type="text"
            placeholder="Enter your message"
            className="form-control"
          />
          <button type="submit" className="btn btn-dark">
            <IoSend />
          </button>
        </form>
      </div>
    </div>
  );
};
export default Chat;
