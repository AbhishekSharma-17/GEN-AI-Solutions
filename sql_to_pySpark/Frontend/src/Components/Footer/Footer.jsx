import React from "react";
import './Footer.css'
import { IoLogoYoutube } from "react-icons/io";
import { FaLinkedin } from "react-icons/fa6";

const Footer = () => {
  return (
    <footer className="footer-section" id="contact">
    

      {/* Footer */}
      <div className="footer-content">
        {/* Logo and Description */}
        <div className="footer-column">
          
          <h1 className="footer-h1">GenAI Protos</h1>
          <p>Transforming SQL to PySpark with AI-powered precision.</p>
        </div>

        {/* Product Links */}
        <div className="footer-column">
          <h4>Product</h4>
          <ul>
            <li>
              <a href="#features">Chat With PPT</a>
            </li>
            <li>
              <a href="#pricing">Chat With SQL</a>
            </li>
            <li>
              <a href="#documentation">Chat With PDF</a>
            </li>
            <li>
              <a href="#documentation">SQL to PySpark</a>
            </li>
          </ul>
        </div>

        {/* Company Links */}
        <div className="footer-column">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="#">Home</a>
            </li>
            <li>
              <a href="#">Code Convertor</a>
            </li>
            <li>
              <a href="#">Features</a>
            </li>
            <li>
              <a href="#">How it Works</a>
            </li>
          </ul>
        </div>

        {/* Stay Updated Section */}
        <div className="footer-column">
          <h4>Stay Updated</h4>
          <form>
            <input
              type="email"
              placeholder="Enter your email"
              aria-label="Enter your email"
            />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>© 2024 GenAI PROTOS. All rights reserved.</p>
        <div className="social-links">
          <a href="#twitter"><IoLogoYoutube  style={{fontSize:"30px", color:"red"}}/></a>
          <a href="#twitter"><FaLinkedin style={{fontSize:"30px", color:"#3399ff"}} /></a>
        
        </div>
      </div>
    </footer>
  );
};

export default Footer;
