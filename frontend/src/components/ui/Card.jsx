import React from 'react';

const Card = ({ children, className = "", glow = false }) => {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6
      transition-all duration-300 hover:border-white/20
      ${glow ? 'shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)]' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;