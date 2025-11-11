import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedMessageProps {
  children: React.ReactNode;
  isOwn: boolean;
  delay?: number;
}

export const AnimatedMessage: React.FC<AnimatedMessageProps> = ({ 
  children, 
  isOwn, 
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        x: isOwn ? 50 : -50,
        scale: 0.8
      }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: 1
      }}
      exit={{ 
        opacity: 0, 
        scale: 0.8,
        transition: { duration: 0.2 }
      }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay
      }}
      whileHover={{ scale: 1.02 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};
