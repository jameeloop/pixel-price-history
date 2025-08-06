import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface QRTooltipProps {
  children: React.ReactNode;
}

const QRTooltip: React.FC<QRTooltipProps> = ({ children }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          <p>Scan to share or revisit this post instantly</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default QRTooltip;