import { createContext, useState, } from "react";

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

  // display user Page
  const [displayUser, setDisplayUser] =useState(false);


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
    // display user page
    displayUser, setDisplayUser
   
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
