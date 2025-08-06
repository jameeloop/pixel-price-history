import React, { useState, useEffect } from 'react';

const psychologyFacts = [
  "As prices increase, perceived value often increases too - known as the Veblen effect",
  "People often value things more when they're harder to obtain - scarcity psychology",
  "Social proof drives behavior - we follow what others do in uncertain situations",
  "Loss aversion makes us value avoiding losses more than acquiring gains",
  "The anchoring effect influences our perception of what's a 'fair' price",
  "FOMO (fear of missing out) creates urgency and drives quick decisions",
  "Digital scarcity creates artificial value in unlimited digital spaces",
  "Escalation of commitment makes us continue investing after initial costs",
  "Social comparison theory explains why we compete for status symbols",
  "The endowment effect makes us value things more once we 'own' them"
];

interface RotatingPsychologyFactsProps {
  className?: string;
}

const RotatingPsychologyFacts: React.FC<RotatingPsychologyFactsProps> = ({ className = "" }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % psychologyFacts.length);
    }, 8000); // Change every 8 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`text-xs text-muted-foreground space-y-1 transition-all duration-500 ${className}`}>
      <p className="font-medium text-primary">🧠 Psychology Fact:</p>
      <p className="min-h-[2.5rem] leading-relaxed">
        "{psychologyFacts[currentFactIndex]}"
      </p>
    </div>
  );
};

export default RotatingPsychologyFacts;