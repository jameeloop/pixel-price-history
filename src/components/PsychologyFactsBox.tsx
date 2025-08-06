import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import RotatingPsychologyFacts from '@/components/RotatingPsychologyFacts';

const PsychologyFactsBox: React.FC = () => {
  return (
    <Card className="glass-card border border-primary/20 bg-gradient-to-r from-purple-50/5 to-purple-100/5">
      <CardContent className="p-2">
        <RotatingPsychologyFacts />
      </CardContent>
    </Card>
  );
};

export default PsychologyFactsBox;