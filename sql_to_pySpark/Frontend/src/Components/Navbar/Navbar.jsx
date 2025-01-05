import React, { useContext, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Context } from "../../Context/Context";

const Navbar = () => {
  const {
    cumulativeTokens,
    cumulativeCost,
  } = useContext(Context);

  return (
    <div className="homePage-navbar">
      <div className="navbar-left icon-logo">
        <a href="">
          <img src={assets.icon} alt="" />
        </a>
        <p className="navbar-title">SQL To PySpark </p>
      </div>

      {/* cumulative token and cost */}

      {cumulativeTokens > 0 ? (
        <div className="cumulatives">
          <div className="cumulative-token">
            <p>
              Cumulative Token: <span>{cumulativeTokens}</span>
            </p>
          </div>
          <div className="cumulative-icon">/</div>
          <div className="cumulative-cost">
            <p>
              Cumulative Cost: <span>{cumulativeCost}</span>
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Navbar;
