import React from 'react';

const GlowButton = ({ children, onClick, className = "" }) => {
  return (
    <button 
      onClick={onClick}
      className={`
        relative px-5 py-2.5 rounded-xl font-semibold text-white 
        bg-gradient-to-r from-cyan-600 to-blue-600 
        hover:shadow-lg hover:shadow-cyan-500/25 active:scale-95 transition-all
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default GlowButton;