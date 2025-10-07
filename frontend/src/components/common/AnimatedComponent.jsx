import React from 'react';
import './AnimatedComponent.css';

export const AnimatedComponent = ({ 
  children, 
  className = '', 
  animation = 'fadeIn',
  duration = 300,
  delay = 0,
  ...props 
}) => {
  const style = {
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`
  };

  return (
    <div 
      className={`animated-component ${animation} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export const AnimatePresence = ({ children, show = true }) => {
  if (!show) return null;
  return children;
}; 