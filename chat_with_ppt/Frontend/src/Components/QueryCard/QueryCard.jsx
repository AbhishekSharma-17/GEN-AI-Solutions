import React from "react";
// import "./QueryCards.css"; // Add styles if needed

const QueryCard = ({ queries }) => {
  return (
    <div className="query-cards-container">
      {queries.map((query, index) => (
        <div className="query-card" key={index}>
          <h3>Query {index + 1}</h3>
          <p>{query}</p>
        </div>
      ))}
    </div>
  );
};

export default QueryCard;
