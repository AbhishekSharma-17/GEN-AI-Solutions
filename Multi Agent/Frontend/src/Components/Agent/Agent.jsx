import React from "react";

const Agent = () => {
  const agents = JSON.parse(localStorage.getItem("Agent")) || [];

  return (
    <div className="agent-div">
      <div className="agent-flex">
        {agents.map((agent, index) => (
          <div key={index} className="display-agent-card" > {/* Light Green */}
            <p style={{fontWeight:"500", fontSize:"20px", textTransform:"capitalize", color:"#02031dec"}}>{agent.agent_name}</p>
            <p style={{marginTop:"10px"}}><strong>Desc :</strong> {agent.agent_desc}</p>
            <p style={{marginTop:"10px"}}><strong>Tools :</strong>  {agent.agent_tool ? agent.agent_tool.join(', ') : 'No tools assigned'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Agent;
