import React, { useState, useEffect } from 'react';
import { AccordionContent } from '@/components/ui/accordion';
import DecryptedText from '@/components/DecryptedText';

interface AnimatedAccordionContentProps {
  children: React.ReactNode;
  value: string;
  isOpen: boolean;
  className?: string;
}

const AnimatedAccordionContent: React.FC<AnimatedAccordionContentProps> = ({
  children,
  value,
  isOpen,
  className = ''
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the accordion is fully opened before starting animation
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isOpen]);

  return (
    <AccordionContent value={value} className={className}>
      {shouldAnimate ? (
        <div className="space-y-3">
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              // Wrap text content in DecryptedText
              if (typeof child.props.children === 'string') {
                return (
                  <DecryptedText
                    key={index}
                    text={child.props.children}
                    delay={index * 200}
                    speed={30}
                    className={child.props.className || ''}
                  />
                );
              }
              // For complex children, recursively process them
              if (child.props.children && Array.isArray(child.props.children)) {
                return React.cloneElement(child, {
                  children: child.props.children.map((grandChild: any, grandIndex: number) => {
                    if (typeof grandChild === 'string') {
                      return (
                        <DecryptedText
                          key={grandIndex}
                          text={grandChild}
                          delay={(index * 200) + (grandIndex * 100)}
                          speed={25}
                        />
                      );
                    }
                    return grandChild;
                  })
                });
              }
            }
            return child;
          })}
        </div>
      ) : (
        children
      )}
    </AccordionContent>
  );
};

export default AnimatedAccordionContent;
