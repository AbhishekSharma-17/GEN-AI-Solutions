import React from "react";
import assets from "../../assets/assets";
// import "./QueryCards.css"; // Add styles if needed

const QueryCard = ({ queries }) => {
    const icon1 = assets.message_icon;
    const icon2 = assets.compass_icon;
    const icon3 = assets.bulb_icon
    const icon4 = assets.history_icon

    const icon_array = [icon1, icon2, icon3, icon4]
  return (
    <div className="query-cards-container">
      {queries.map((query, index) => (
        <div className="query-card" key={index}>
          <p>{query}</p>
            <img src={icon_array[index]} className="query-card-icon-style" alt="" />
        </div>
      ))}
    </div>
  );
};

export default QueryCard;
