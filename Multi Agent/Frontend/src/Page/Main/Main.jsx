import assets from "../../assets/assets";
import "./Main.css";
import { useContext } from "react";
import { AdminContext } from "../../Context/AdminContext";
import ActiveToolsAgent from "../../Components/Active Tools Agents/ActiveToolsAgent";
import { BrowserRouter, Routes, Route,Link } from "react-router-dom";
import Graph from "../../Components/Graph/Graph";
import Agent from "../../Components/Agent/Agent";
import Tools from "../../Components/Tools/Tools";
import Chat from "../../Components/Chat/Chat";

const Main = () => {
  const { allAgentData } = useContext(AdminContext);

  return (
    <div className="main-user">
      {/* sidebar  */}
      <div className="user-sidebar">
        <ActiveToolsAgent></ActiveToolsAgent>
      </div>
      {/* graph */}
       <div className="user-graph-section">
        <BrowserRouter>
          {/* Navbar Links should be outside of Routes */}
          <div className="content-navbar">
            <Link to="/graph">Graph</Link>
            <Link to="/agents">Agents</Link>
            <Link to="/tools">Tools</Link>
          </div>

          {/* Routes should only contain Route components */}
          <div className="content">
          <Routes>
            <Route path="/graph" element={<Graph />} />
            <Route path="/agents" element={<Agent/>} />
            <Route path="/tools" element={<Tools/>} />
          </Routes>
          </div>
        </BrowserRouter>
      </div>
      {/* chat */}
      <div className="user-chat-section">
        <Chat/>
      </div>
    </div>
  );
};

export default Main;
