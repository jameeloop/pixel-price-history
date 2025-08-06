import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingUploadCTAProps {
  onClick: () => void;
}

const FloatingUploadCTA: React.FC<FloatingUploadCTAProps> = ({ onClick }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, duration: 0.5, type: "spring" }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        onClick={onClick}
        size="lg"
        className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-4"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="flex items-center gap-2 relative z-10">
          <Upload className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          <span className="font-semibold">Upload Now!</span>
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-purple-600/30"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </Button>
    </motion.div>
  );
};

export default FloatingUploadCTA;