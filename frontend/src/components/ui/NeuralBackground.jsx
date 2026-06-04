import React from 'react';
import { motion } from 'framer-motion';

const NeuralBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      {/* Orb 1: Cyan (Health) */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 100, 0], 
          y: [0, -50, 0],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[100px]"
      />
      
      {/* Orb 2: Purple (Intelligence) */}
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          x: [0, -100, 0], 
          y: [0, 100, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"
      />

      {/* Orb 3: Green (Bio) */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          x: [-50, 50, -50], 
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px]"
      />
      
      {/* Grid Overlay for "Tech" feel */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
    </div>
  );
};

export default NeuralBackground;