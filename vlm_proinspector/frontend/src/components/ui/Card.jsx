import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = false,
  animate = false,
  onClick = null,
  ...props 
}) => {
  const baseClasses = "card";
  const hoverClasses = hover ? "hover:shadow-lg transition-shadow cursor-pointer" : "";
  const clickableClasses = onClick ? "cursor-pointer" : "";
  
  const cardContent = (
    <div 
      className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {cardContent}
      </motion.div>
    );
  }
  
  return cardContent;
};

export default Card;
