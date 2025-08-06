import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressMilestonesProps {
  currentPrice: number; // in cents
}

const ProgressMilestones: React.FC<ProgressMilestonesProps> = ({ currentPrice }) => {
  const milestones = [100, 500, 1000, 2000, 5000]; // in cents ($1, $5, $10, $20, $50)
  
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  const getCurrentMilestoneIndex = () => {
    for (let i = 0; i < milestones.length; i++) {
      if (currentPrice < milestones[i]) {
        return i;
      }
    }
    return milestones.length - 1;
  };

  const currentMilestoneIndex = getCurrentMilestoneIndex();
  const currentMilestone = milestones[currentMilestoneIndex];
  const previousMilestone = currentMilestoneIndex > 0 ? milestones[currentMilestoneIndex - 1] : 0;
  
  const progress = currentPrice >= currentMilestone 
    ? 100 
    : ((currentPrice - previousMilestone) / (currentMilestone - previousMilestone)) * 100;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🎯 Price Milestones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatPrice(previousMilestone)}
            </span>
            <span className="font-medium text-primary">
              Progress to {formatPrice(currentMilestone)}
            </span>
          </div>
          
          <Progress value={progress} className="h-3" />
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">
              Current: {formatPrice(currentPrice)}
            </span>
            <span className="text-accent font-medium">
              {currentPrice >= currentMilestone ? '🎉 Milestone reached!' : `${formatPrice(currentMilestone - currentPrice)} to go`}
            </span>
          </div>
          
          <div className="grid grid-cols-5 gap-1 mt-4">
            {milestones.map((milestone, index) => (
              <div 
                key={milestone}
                className={`text-center text-xs p-2 rounded-md ${
                  currentPrice >= milestone 
                    ? 'bg-primary text-primary-foreground' 
                    : index === currentMilestoneIndex
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {formatPrice(milestone)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressMilestones;