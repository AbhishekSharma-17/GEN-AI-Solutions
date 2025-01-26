import React from "react";
import "./Footer.css";
import { IoLogoYoutube } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa6";
import assets from "../../assets/assets";

const Footer = () => {
  const projects = [
    {
      name: "Chat With PPT",
      icon: assets.gemini_icon,
      link: "https://www.youtube.com/watch?v=5Qc6QF8p",
    },
    {
      name: "Chat With PDF",
      icon: assets.gemini_icon,
      link: "https://www.youtube.com/watch?v=5Qc6QF8p",
    },
    {
      name: "Advanced PDF",
      icon: assets.gemini_icon,
      link: "https://www.youtube.com/watch?v=5Qc6QF8p",
    },
    {
        name: "Chat With Anything",
        icon: assets.gemini_icon,
        link: "https://www.youtube.com/watch?v=5Qc6QF8p",
    },
    {
      name: "Social Media Marketting Agent",
      icon: assets.gemini_icon,
      link: "https://www.youtube.com/watch?v=5Qc6QF8p",
    },
    {
      name: "Chat With PPT",
      icon: assets.gemini_icon,
      link: "https://www.youtube.com/watch?v=5Qc6QF8p",
    },
  ];

  return (
    <div className="footer">
      {/* Footer */}
      <div className="footer-content">
        {/* Logo and Description */}
        <div className="footer-column">
          <img src={assets.genAILogo} alt="" srcset="" />
          <p>"Transforming Social Engagement with Intelligent Automation."</p>
        </div>

        {/* Product Links */}
        <div className="footer-grid">
          {projects.map((project, index) => (
            <div key={index} className="project-card">
              <img
                src={project.icon}
                alt={project.name}
                className="project-icon"
              />
              <a href={project.link} target="_blank" rel="noopener noreferrer">
                {project.name}
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-bottom container">
        <p>© 2024 GenAI PROTOS. All rights reserved.</p>
        <div className="social-links">
          <a href="#twitter">
            <IoLogoYoutube style={{ fontSize: "30px", color: "red" }} />
          </a>
          <a href="#twitter">
            <FaLinkedin style={{ fontSize: "30px", color: "#3399ff" }} />
          </a>
        </div>
      </div>
    </div>
  );
};
export default Footer;
