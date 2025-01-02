import React from 'react'
import { assets } from "../../assets/assets";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import './Homepage_Container.css'

const Homepage_Container = () => {
  return (
    <div className="homePage-container">
         <div className="homepage-textual-content">
           <div className="homepage-text-content">
             <p>LLM Configuration</p>
             <span>
               Set up your AI environment by providing your API keys. We ensure
               secure handling of your Credentials.
             </span>
           </div>
           <div className="homepage-form-content">
             <form>
               <div className="mb-4">
                 <label htmlFor="exampleSelect" className="form-label">
                   Select Provider
                 </label>
                 <div className="dropdown">
                   <button
                     id="customDropdown"
                     className="btn btn-transparent dropdown-toggle w-100"
                     type="button"
                     data-bs-toggle="dropdown"
                     aria-expanded="false"
                    //  ref={form_LLM_type}
                   >
                     {/* {LLMType || "Select LLM Type"} */}
                   </button>
                   <ul
                     className="dropdown-menu w-100"
                     aria-labelledby="dropdownMenuButton"
                   >
                     {providers.map((provider) => (
                       <li key={provider.value}>
                         <button
                           type="button" // Prevents form submission
                           className="dropdown-item d-flex align-items-center"
                           onClick={() => setLLMType(provider.label)}
                         >
                           <img
                             src={provider.img}
                             alt={provider.label}
                             className="me-2"
                             style={{
                               width: "20px",
                               height: "20px",
                               borderRadius: "10px",
                             }}
                           />
                           {provider.label}
                         </button>
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
               <div className="mb-4">
                 <label htmlFor="databaseUri" className="form-label">
                   Database URI
                 </label>
                 <input
                   type="text"
                   className="form-control"
                   id="databaseUri"
                   placeholder="Database URI"
                   ref={form_Database_URI}
                   required
                 />
               </div>
               <div className="mb-4">
                 <label htmlFor="apiKey" className="form-label">
                   API Key
                 </label>
                 <input
                   type="password"
                   className="form-control"
                   id="apiKey"
                   placeholder="API Key"
                   ref={form_API_Key}
                   required
                 />
               </div>
   
               <div className="mb-3">
                 <button
                   type="submit"
                   className="btn btn-dark"
                   disabled={isLoadings}
                 >
                   {isLoadings ? "Saving Configuration..." : "Save Configuration"}
                 </button>
               </div>
             </form>
           </div>
         </div>
         <div className="homepage-setup-content" style={{ gap: "30px" }}>
           <div className="quick-setup-guide">
             <p>Quick Setup Guide</p>
             <div className="homepage-guide-list">
               <div className="item">
                 <p className="serial">1</p>
                 <div className="item-description">
                   <p className="item-title">Generate API Keys</p>
                   <p className="item-def">
                     Visit your AI provider dashboard to generate the required API
                     keys.
                   </p>
                 </div>
               </div>
               <div className="item">
                 <p className="serial">2</p>
                 <div className="item-description">
                   <p className="item-title">Configure Integration</p>
                   <p className="item-def">
                     Enter both API keys in the configuration form.
                   </p>
                 </div>
               </div>
               <div className="item">
                 <p className="serial">3</p>
                 <div className="item-description">
                   <p className="item-title">Verify Connection</p>
                   <p className="item-def">
                     Check the connection status and start using the integration.
                   </p>
                 </div>
               </div>
             </div>
           </div>
           <div className="homepage-setup-image">
             <img src={assets.frontPage} alt="Setup" />
           </div>
         </div>
       </div>
  )
}

export default Homepage_Container
