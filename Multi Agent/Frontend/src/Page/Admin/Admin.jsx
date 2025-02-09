import React, { useContext } from "react";
import "./Admin.css";
import AdminNav from "../../Components/Admin Nav/AdminNav";
import assets from "../../assets/assets";
import { FaUser, FaUserShield } from "react-icons/fa6";
import { AdminContext } from "../../Context/AdminContext";
import { toast } from "react-toastify";

const Admin = () => {
  const {
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
  } = useContext(AdminContext);

  const handleFormData = (event) => {
    event.preventDefault();
    console.log("Admin Email: ", adminEmail);
    console.log("Admin Password: ", adminPassword);

    const adminData = {
      admin_email: adminEmail,
      admin_password: adminPassword,
    };

    // Store as JSON string
    localStorage.setItem("Admin", JSON.stringify(adminData));

    if (adminEmail === "admin@gmail.com" && adminPassword === "admin@1234") {
      setIsAdminLoggedIn(true);
      toast.success("Admin Logged In Successfully");
    } else {
      toast.error("Log In Failed !! ");
    }
    setAdminEmail("");
    setAdminPassword("");
  };

  const addToolHandle = (event) => {
    const selectedTool = event.target.textContent;

    setAgentTool((prevTools) => {
      // Ensure the tool is not added multiple times
      if (!prevTools.includes(selectedTool)) {
        return [...prevTools, selectedTool];
      }
      return prevTools;
    });
  };

  const saveAgentData = () => {
    console.log("Saving all agent")
    const agentData = {
      agent_name: agentName,
      agent_desc: agentDesc,
      agent_tool: agentTool,
      agent_obj: agentObj,
      agent_string_list: agentStringList,
    };

    // console.log(agentData);

    // Store in localStorage as JSON string
    // localStorage.setItem("Agent", JSON.stringify(agentData));

    // Append new agentData to existing state
    setAllAgentData((prevData) => [...prevData, agentData]);
    console.log(allAgentData);

    // Clear input fields
    setAgentName("");
    setAgentDesc("");
    setAgentObj("");
    setAgentStringList("");

  };

  return (
    <div className="admin-page">
      <AdminNav></AdminNav>

      <div className="main-admin-section">
        {/* admin login */}
        {!isAdminLoggedIn ? (
          <div className="admin-login container">
            <form
              onSubmit={(event) => {
                handleFormData(event);
              }}
            >
              <div className="mb-5 form-top">
                <FaUserShield style={{ fontSize: "150px" }} />
              </div>
              <div className="mb-3">
                <label className="form-label">Admin ID</label>
                <input
                  value={adminEmail}
                  type="email"
                  className="form-control"
                  aria-describedby="emailHelp"
                  placeholder="Admin ID"
                  onChange={(event) => {
                    setAdminEmail(event.target.value);
                  }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  value={adminPassword}
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  onChange={(event) => {
                    setAdminPassword(event.target.value);
                  }}
                />
              </div>

              <button type="submit" className="btn btn-dark w-100">
                Submit
              </button>
            </form>
            <img src={assets.frontPage} alt="" />
          </div>
        ) : (
          <div className="create-agent container">
            <p className="agent-title">Configure Your AI Agent</p>
            <div className="data">
              {/* name , descrition , objective  */}
              <div className="name-desc-obj">
                <div className="mb-3 agent-name">
                  <label className="form-label">Agent Name</label>
                  <input
                    type="text"
                    name=""
                    id=""
                    value={agentName}
                    className="form-control"
                    style={{ height: "30px" }}
                    aria-describedby="inputGroup-sizing-default"
                    placeholder="Agent name"
                    onChange={(event) => {
                      setAgentName(event.target.value);
                    }}
                  />
                </div>
                <div className="mb-3 agent-desc">
                  <label className="form-label">Description</label>
                  <textarea
                    value={agentDesc}
                    className="form-control"
                    placeholder="Decsribe your agent capabilities"
                    id="floatingTextarea2"
                    style={{ height: "100px" }}
                    onChange={(event) => {
                      setAgentDesc(event.target.value);
                    }}
                  ></textarea>
                </div>
                <div className="mb-3 agent-obj">
                  <label className="form-label">Objective</label>
                  <textarea
                    value={agentObj}
                    className="form-control"
                    placeholder="Define agent primary objective"
                    id="floatingTextarea2"
                    style={{ height: "100px" }}
                    onChange={(event) => {
                      setAgentObj(event.target.value);
                    }}
                  ></textarea>
                </div>
              </div>

              {/* tools - string  */}
              <div className="tools-string">
                {/* tools */}
                <div className="mb-3">
                  <label className="form-label">Tools</label>
                  <div className="tools-div">
                    <p onClick={addToolHandle}>web search</p>
                    <p onClick={addToolHandle}>Code Interpreter</p>
                    <p onClick={addToolHandle}>File Manager</p>
                    <p onClick={addToolHandle}>Data Analysis</p>
                  </div>
                </div>
                {/* string */}
                <div className="mb-3">
                  <label className="form-label">String List</label>
                  <div className="string-list">
                    <input
                      value={agentStringList}
                      type="text"
                      name=""
                      id=""
                      placeholder="Enter String Value"
                      className="form-control"
                      onChange={(event) => {
                        setAgentStringList(event.target.value);
                      }}
                    />
                  </div>
                </div>
                {/* save and next button */}
                <div className="mb-3 mt-3 button-div">
                  <button className="btn btn-dark">Reset</button>
                  <button
                    className="btn btn-outline-dark"
                    onClick={saveAgentData}
                  >
                    Create New Agent
                  </button>
                </div>
              </div>
            </div>
            <button
              className="btn btn-dark"
              style={{ fontWeight: "500", fontSize: "18px" }}
            >
              Save All Agents
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
