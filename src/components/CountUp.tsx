import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  start?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  onComplete?: () => void;
  onUpdate?: (value: number) => void;
}

const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 2000,
  start = 0,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
  onComplete,
  onUpdate
}) => {
  const [count, setCount] = useState(0); // Always start from 0
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const startValueRef = useRef<number>(0); // Always start from 0

  useEffect(() => {
    if (end === startValueRef.current) return;

    setIsAnimating(true);
    startValueRef.current = 0; // Always start from 0
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) return;

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = 0 + (end - 0) * easeOut; // Always animate from 0 to end
      
      setCount(currentValue);
      onUpdate?.(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setIsAnimating(false);
        onComplete?.();
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, onComplete, onUpdate]);

  const formatNumber = (num: number) => {
    return num.toFixed(decimals);
  };

  return (
    <span className={className}>
      {prefix}{formatNumber(count)}{suffix}
    </span>
  );
};

export default CountUp;
