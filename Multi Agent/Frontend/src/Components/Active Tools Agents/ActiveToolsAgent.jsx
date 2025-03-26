import assets from "../../assets/assets";
import "./ActiveTools.css";



const ActiveToolsAgent = () => {
  const getStatusBadgeClass = (index) => {
    const statuses = ["coordinating", "active", "processing", "running"];
    return statuses[index % statuses.length];
  };
  return (
    <div style={{height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between", margin:"10px 0"}}>
      <div className="sidebar">
        <h6>Active Tools / Agents</h6>
        <div className="tools-agent">
          <div className="tools-agent-box">
            <div className="agent-card">
              <div className="agent-header">
                <h5>Tech Fetcher</h5>
                <span className={`status-badge ${getStatusBadgeClass(0)}`}>
                  {getStatusBadgeClass(1)}
                </span>
              </div>
              <p className="agent-description">Used for Fetching Technology</p>
            </div>
          </div>
        </div>
      </div>
      <div className="logo-icon" >
        <img src={assets.icon} className="icon" alt="" />
        <img src={assets.logo} className="logo" alt="" />
        
      </div>
    </div>
  );
};

export default ActiveToolsAgent;
