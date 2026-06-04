import React, { useRef, useState } from 'react';

const TiltCard = ({ children, className = "" }) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10; // Max rotation deg
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-6 ${className}`}
    >
      {/* Light Reflection Glare */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${50 + rotation.y * 5}% ${50 + rotation.x * 5}%, rgba(255,255,255,0.1), transparent 60%)`
        }}
      />
      {children}
    </div>
  );
};

export default TiltCard;