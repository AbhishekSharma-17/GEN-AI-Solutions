import { createContext, useState, useEffect } from "react";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  //   agent name
  const [agentName, setAgentName] = useState("");
  const [agentDesc, setAgentDesc] = useState("");
  const [agentObj, setAgentObj] = useState("");
  const [agentTool, setAgentTool] = useState([]);
  const [agentStringList, setAgentStringList] = useState("");

  //   this state will contain data of all agent saved by user
  const [allAgentData, setAllAgentData] = useState([]);

  const contextValue = {
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
    agentObj,
    setAgentObj,
    agentTool,
    setAgentTool,
    agentStringList,
    setAgentStringList,
    allAgentData,
    setAllAgentData,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
