import React from "react";
import assets from "../../assets/assets";

const BottomSection = ({ input, setInput }) => (
  <div className="main-bottom">
    <form className="search-box">
      <input
        type="text"
        placeholder="Ask GenAI Protos anything..."
        onChange={(event) => setInput(event.target.value)}
        value={input}
      />
      <div>
        <img src={assets.gallery_icon} alt="" />
        <img src={assets.mic_icon} alt="" />
        {input ? <img src={assets.send_icon} alt="" /> : null}
      </div>
    </form>
    <p className="bottom-info">
      GenAI Protos may display inaccurate information, such as the number of
      bytes and also including about the people.
    </p>
  </div>
);

export default BottomSection;
