import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../Context/AdminContext";
import "./AgentCreation.css";
import { toast } from "react-toastify";

const AgentCreation = () => {
  const {
    isAdminLoggedIn,
    displayAgentCreation,
    agentName,
    setAgentName,
    agentDesc,
    setAgentDesc,
    agentTool,
    setAgentTool,
    AgentPersonality,
    setAgentPersonality,
    agentTone,
    setAgentTone,
    agentGoal,
    setAgentGoal,
    agentDomain,
    setAgentDomain,
    allAgentData,
    setAllAgentData,
    setNavigateToMain,
    setDisplayUser,
  } = useContext(AdminContext);

  const toolsList = [
    "WikipediaTool",
    "ArXivTool",
    "WebScrapeTool",
    "search_web",
    "RAGTool",
    "FileReadTool",
    "FileWriteTool",
  ];

  const handleToolChange = (tool) => {
    setAgentTool((prevTools) =>
      prevTools.includes(tool)
        ? prevTools.filter((item) => item !== tool)
        : [...prevTools, tool]
    );
  };


  // {
  //   "user_id": "user123",
  //   "description": "A creative writing coach and mentor",
  //   "goal": "Help users improve their creative writing skills",
  //   "tools": ["rag_tool", "store_in_memory", "retrieve_from_memory"],
  //   "personality": "Encouraging and insightful",
  //   "tone": "Inspirational and constructive",
  //   "domain_expertise": "Creative writing, literature, storytelling techniques"
  // }

  const saveAgentData = async () => {
    if (
      !agentDesc ||
      agentTone === "" ||
      AgentPersonality === "" ||
      agentDomain === ""
    ) {
      toast.warn("Please fill out required fields");
      return;
    }

    const agentData = {
      user_id: localStorage.getItem("AdminId"),
      description: agentDesc,
      goal: agentGoal,
      tools: agentTool,
      personality: AgentPersonality,
      tone: agentTone,
      domain_expertise: agentDomain,
    };

    try {
      const response = await fetch("http://localhost:8000/prompt-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(agentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save agent data");
      }

      const result = await response.json();

      // Store the agent name, system prompt, and description
      const storedData = {
        agent_name: result.agent_name,
        system_prompt: result.system_prompt,
        description: agentDesc,
      };

      const storedAgents = JSON.parse(localStorage.getItem("Agent")) || [];
      const newAgentData = [...storedAgents, storedData];
      localStorage.setItem("Agent", JSON.stringify(newAgentData));
      setAllAgentData(newAgentData);

      toast.success(`${result.agent_name} Created Successfully`);
    } catch (error) {
      console.error("Error saving agent data:", error);
      toast.error("Error saving agent data. Please try again.");
    }

    // Reset fields
    setAgentName("");
    setAgentDesc("");
    setAgentTool([]);
    setAgentPersonality("");
    setAgentTone("");
    setAgentDomain("");
    setAgentGoal("");
  };

  useEffect(() => {
    const storedAgents = JSON.parse(localStorage.getItem("Agent")) || [];
    setAllAgentData(storedAgents);
  }, []);

  if (!isAdminLoggedIn || !displayAgentCreation) return null;

  return (
    <div className="agent-container-parent">
      <div className="create-agent container">
        <p className="agent-title">Configure Your AI Agent</p>
        <div className="data">
          <div className="name-desc-obj">
            {/* <div className="mb-3 agent-name">
              <label className="form-label">Agent Name</label>
              <input
                type="text"
                value={agentName}
                className="form-control"
                placeholder="Agent name"
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div> */}

            <div className="mb-3 agent-desc">
              <label className="form-label">Description</label>
              <textarea
                value={agentDesc}
                className="form-control"
                placeholder="Describe your agent capabilities"
                onChange={(e) => setAgentDesc(e.target.value)}
              ></textarea>
            </div>

            <div className="mb-3 agent-obj">
              <label className="form-label">Personality</label>
              <textarea
                value={AgentPersonality}
                className="form-control"
                placeholder="Define agent personality"
                onChange={(e) => setAgentPersonality(e.target.value)}
              ></textarea>
            </div>

            <div className="mb-3 agent-obj">
              <label className="form-label">Agent Tone</label>
              <textarea
                value={agentTone}
                className="form-control"
                placeholder="Define agent tone"
                onChange={(e) => setAgentTone(e.target.value)}
              ></textarea>
            </div>

            <div className="mb-3 agent-obj">
              <label className="form-label">Goal</label>
              <textarea
                value={agentGoal}
                className="form-control"
                placeholder="Define agent goal"
                onChange={(e) => setAgentGoal(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="tools-string">
            <div className="mb-3">
              <label className="form-label">Tools</label>
              <div className="tools-div">
                {toolsList.map((tool, index) => (
                  <div key={index} className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={`tool-${index}`}
                      checked={agentTool.includes(tool)}
                      onChange={() => handleToolChange(tool)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`tool-${index}`}
                    >
                      {tool}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Agent Domain Expertise</label>
              <input
                value={agentDomain}
                type="text"
                className="form-control"
                placeholder="Enter Agent Domain"
                onChange={(e) => setAgentDomain(e.target.value)}
              />
            </div>

            <div className="mb-3 mt-3 button-div">
              <button className="btn btn-dark" onClick={() => setAgentTool([])}>
                Reset
              </button>
              <button
                className="btn btn-outline-success"
                onClick={saveAgentData}
              >
                Save Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCreation;
