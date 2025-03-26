import { createContext, useState } from "react";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminId, setAdminId] = useState("");

  //   agent name
  const [agentName, setAgentName] = useState(""); //agent Name
  const [agentDesc, setAgentDesc] = useState(""); // agent description
  const [agentTool, setAgentTool] = useState([]);
  const [AgentPersonality, setAgentPersonality] = useState("");
  const [agentTone, setAgentTone] = useState("");
  const [agentDomain, setAgentDomain] = useState([]);
  const [agentGoal, setAgentGoal] = useState("");

  //   this state will contain data of all agent saved by user
  const [allAgentData, setAllAgentData] = useState([]);

  // display user Page
  const [displayAgentCreation, setDisplayAgentCreation] = useState(false);
  const [navigateToMain, setNavigateToMain] = useState(false); // navigate to main

  const contextValue = {
    adminId,
    setAdminId,
    adminEmail,
    setAdminEmail,
    adminPassword,
    setAdminPassword,
    isAdminLoggedIn,
    setIsAdminLoggedIn,
    agentName,
    setAgentName,

    agentDesc,
    setAgentDesc,

    AgentPersonality,
    setAgentPersonality,

    agentTool,
    setAgentTool,

    agentTone,
    setAgentTone,

    agentDomain,
    setAgentDomain,

    agentGoal,
    setAgentGoal,

    allAgentData,
    setAllAgentData,

    // display agent creation
    displayAgentCreation,
    setDisplayAgentCreation,

    // navigate to main
    navigateToMain,
    setNavigateToMain,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
