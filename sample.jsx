<div className="result">
  <div className="result-title">
    <FaUserCircle style={{ fontSize: "30px" }} />
    <p>{recentPrompt}</p>
  </div>
  <div className="result-data">
    <img src={assets.icon} alt="" />
    {loadings ? (
      <ResponseLoader />
    ) : (
      <div>
        {chatHistory.map((chat, index) => (
          <p key={chat.id} className={chat.type}>
            <strong>{chat.type === "user" ? "You: " : "Bot: "}</strong>
            <span dangerouslySetInnerHTML={{ __html: chat.text }}></span>
          </p>
        ))}
      </div>
    )}
  </div>
</div>;
