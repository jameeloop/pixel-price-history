import React, { useState, useEffect } from 'react';

interface DecryptedTextProps {
  text: string;
  delay?: number;
  className?: string;
  speed?: number;
  characters?: string;
}

const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  delay = 0,
  className = '',
  speed = 50,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      let currentIndex = 0;
      
      // Start with random characters for the entire text
      const initialRandomText = Array.from({ length: text.length }, () => 
        characters[Math.floor(Math.random() * characters.length)]
      ).join('');
      setDisplayText(initialRandomText);
      
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          // Replace random characters with actual text character by character
          setDisplayText(prev => 
            text.slice(0, currentIndex + 1) + 
            prev.slice(currentIndex + 1)
          );
          
          currentIndex++;
        } else {
          // Animation complete, ensure final text is shown
          setDisplayText(text);
          clearInterval(interval);
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, delay, speed, characters]);

  return (
    <span className={`font-mono ${className}`}>
      {displayText}
    </span>
  );
};

export default DecryptedText;
