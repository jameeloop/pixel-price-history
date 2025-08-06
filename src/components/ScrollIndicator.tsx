import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const ScrollIndicator: React.FC = () => {
  const [showIndicator, setShowIndicator] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Check if upload form is visible on screen
      const uploadForm = document.getElementById('upload-form');
      if (uploadForm) {
        const rect = uploadForm.getBoundingClientRect();
        // Hide indicator when upload form is in view
        if (rect.top <= window.innerHeight) {
          setShowIndicator(false);
        } else {
          setShowIndicator(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Check initially
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-8 left-8 z-10 animate-bounce">
      <div className="bg-primary/10 backdrop-blur-sm rounded-full p-3 border border-primary/20">
        <ChevronDown className="w-5 h-5 text-primary animate-pulse" />
      </div>
    </div>
  );
};

export default ScrollIndicator;