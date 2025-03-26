import assets from "../../assets/assets";
import "./Main.css";
import { useContext, useState } from "react";
import { AdminContext } from "../../Context/AdminContext";
import ActiveToolsAgent from "../../Components/Active Tools Agents/ActiveToolsAgent";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import Graph from "../../Components/Graph/Graph";
import Agent from "../../Components/Agent/Agent";
import Tools from "../../Components/Tools/Tools";
import Chat from "../../Components/Chat/Chat";
import { FaArrowRight } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa";
import { CgLogOut } from "react-icons/cg";
import AgentCreation from "../../Components/Agent Creation/AgentCreation";

const Main = () => {
  const { allAgentData } = useContext(AdminContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="main-user">
      {/* sidebar  */}
      <div className={`user-sidebar ${isSidebarOpen ? "open" : "collapsed"}`}>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isSidebarOpen ? <FaArrowLeft /> : <FaArrowRight />}
        </button>
        {isSidebarOpen && <ActiveToolsAgent />}
      </div>

      {/* graph */}
      <div className="user-graph-section">
        <BrowserRouter>
          {/* Navbar Links using NavLink for active state */}
          <div style={{display:"flex",justifyContent:"space-between"}}>

          <div className="content-navbar">
          <NavLink to="/create-agent" className="nav-link">
              Create Agent
            </NavLink>
            <NavLink to="/chat" className="nav-link">
              Chat
            </NavLink>
            <NavLink to="/graph" className="nav-link">
              Graph
            </NavLink>
            <NavLink to="/agents" className="nav-link">
              Agents
            </NavLink>
            <NavLink to="/tools" className="nav-link">
              Tools
            </NavLink>
           
          </div>
          <div id="disconnect">
          <CgLogOut />
          <p>Logout</p>
          </div>
          </div>

          {/* Routes */}
          <div className="content">
            <Routes>
              <Route path="/graph" element={<Graph />} />
              <Route path="/agents" element={<Agent />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/create-agent" element={<AgentCreation />} />
              <Route path="*" element={<Navigate to="/create-agent" />} />
            </Routes>
          </div>
        </BrowserRouter>
      </div>
    </div>
  );
};

export default Main;
