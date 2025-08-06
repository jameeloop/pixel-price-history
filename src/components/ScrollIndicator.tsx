import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const ScrollIndicator: React.FC = () => {
  const [showIndicator, setShowIndicator] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Hide indicator after user scrolls down 100px
      if (window.scrollY > 100) {
        setShowIndicator(false);
      } else {
        setShowIndicator(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!showIndicator) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
      <div className="flex flex-col items-center space-y-1">
        <div className="bg-primary/10 backdrop-blur-sm rounded-full p-2 border border-primary/20">
          <ChevronDown className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">Scroll to explore</span>
      </div>
    </div>
  );
};

export default ScrollIndicator;