import React, { useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
const Navbar = () => {
  return (
    <div className="homePage-navbar">
      <a href=""><img src={assets.icon} alt="" /></a>
      <p className="navbar-title">SQL To PySpark </p>
    </div>
  );
};

export default Navbar;
