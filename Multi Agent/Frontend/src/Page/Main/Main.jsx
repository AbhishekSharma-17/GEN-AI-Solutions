import assets from "../../assets/assets";
import "./Main.css";
import { useContext, useState, useEffect } from "react";
import { AdminContext } from "../../Context/AdminContext";
import ActiveToolsAgent from "../../Components/Active Tools Agents/ActiveToolsAgent";
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
import Graph from "../../Components/Graph/Graph";
import Agent from "../../Components/Agent/Agent";
import Tools from "../../Components/Tools/Tools";
import Chat from "../../Components/Chat/Chat";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { CgLogOut } from "react-icons/cg";
import AgentCreation from "../../Components/Agent Creation/AgentCreation";

const Main = () => {
  const { isAdminLoggedIn, setIsAdminLoggedIn } = useContext(AdminContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Collapse sidebar automatically based on screen size
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 768); // Collapse on screens smaller than 768px
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleLogOut = () => {
    // console.log(isAdminLoggedIn);
    localStorage.removeItem("AdminEmail");
    localStorage.removeItem("AdminId");
    localStorage.removeItem("Agent");
    localStorage.removeItem("adminChatMessages");
    localStorage.removeItem("chatMessages");
    localStorage.setItem("isAdminLoggedIn",false)
    navigate('/');
    setIsAdminLoggedIn(false);
  };

  return (
    <div className="main-user">
      {/* Sidebar */}
      <div className={`user-sidebar ${isSidebarOpen ? "open" : "collapsed"}`}>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isSidebarOpen ? <FaArrowLeft /> : <FaArrowRight />}
        </button>
        {isSidebarOpen && <ActiveToolsAgent />}
      </div>
      
      <div className="user-graph-section">
        {/* <BrowserRouter> */}
          <div style={{ display: "flex", justifyContent: "space-between", boxShadow: "0px 0px 10px #ddd" }}>
            <div className="content-navbar">
              <NavLink to="/create-agent" className="nav-link">Create Agent</NavLink>
              <NavLink to="/chat" className="nav-link">Chat</NavLink>
              {/* <NavLink to="/graph" className="nav-link">Graph</NavLink> */}
              <NavLink to="/agents" className="nav-link">Agents</NavLink>
              <NavLink to="/tools" className="nav-link">Tools</NavLink>
            </div>
            <div id="disconnect-out">
              <div id="disconnect-in">
                <CgLogOut />
                <p onClick={handleLogOut}>Logout</p>
              </div>
            </div>
          </div>

          {/* Routes */}
          <div className="content">
            <Routes>
              {/* <Route path="/graph" element={<Graph />} /> */}
              <Route path="/agents" element={<Agent />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/create-agent" element={<AgentCreation />} />
              <Route path="*" element={<Navigate to="/create-agent" />} />
            </Routes>
          </div>
        {/* </BrowserRouter> */}
      </div>
    </div>
  );
};

export default Main;
