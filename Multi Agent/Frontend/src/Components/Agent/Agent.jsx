import React, { useEffect, useState } from "react";
import "./Agent.css";
import { IoCopy } from "react-icons/io5";
import { toast } from "react-toastify";
import { GoDotFill } from "react-icons/go";

const Agent = () => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [editedPrompt, setEditedPrompt] = useState("");

  const fetchAgents = () => {
    const agentData = JSON.parse(localStorage.getItem("Agent")) || [];
    setAgents(agentData);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const openModal = (agent) => {
    setSelectedAgent(agent);
    setEditedPrompt(agent.system_prompt);
  };

  const closeModal = () => {
    setSelectedAgent(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedPrompt);
    toast.success("System Prompt copied !");
    closeModal();
  };

  return (
    <div className="agent-div" >
      {agents.length === 0 ? (
        <p className="no-agent-heading">No agents available</p>
      ) : (
        <div className="agent-flex">
          {agents.map((agent, index) => (
            <div key={index} className="display-agent-card">
              <h5 className="agent-name">{agent.agent_name}</h5>
              <p className="agent-desc">
                <GoDotFill style={{ marginRight: "8px" }} />
                {agent.description}
              </p>
              <p className="edit-link" onClick={() => openModal(agent)}>
                Get System Prompt
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedAgent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-buttons">
              <h6>
                <strong>{selectedAgent.agent_name}</strong> : System Prompt
              </h6>
              <IoCopy size={20} onClick={copyToClipboard} title="Copy Prompt" />
            </div>
            <textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              rows={8}
              style={{ textAlign: "justify" }}
              className="prompt-textarea"
            />
            <div className="modal-buttons">
              <button onClick={closeModal} className="btn btn-outline-danger">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agent;
