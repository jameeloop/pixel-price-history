import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Camera } from 'lucide-react';
import { usePricing } from '@/hooks/usePricing';
import CountUp from '@/components/CountUp';

interface PricingDisplayProps {
  onPriceUpdate: (price: number) => void;
}

const PricingDisplay: React.FC<PricingDisplayProps> = ({ onPriceUpdate }) => {
  const { uploadCount, nextPrice, formatPrice } = usePricing();

  useEffect(() => {
    onPriceUpdate(nextPrice); // Pass the next price (what user will pay) to the upload form
  }, [nextPrice, onPriceUpdate]);


  return (
    <Card className="glass-card experiment-glow text-center p-6">
      <h3 className="text-xl font-semibold mb-2">The Experiment Status</h3>
      <p className="text-sm text-muted-foreground mb-4">How high will the community push it? 🚀</p>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Next Upload Price</p>
          <p className="text-4xl font-bold gradient-text price-ticker">
            <CountUp 
              end={nextPrice / 100} 
              duration={1500}
              prefix="$"
              decimals={2}
              className="text-2xl font-bold text-green-500"
            />
          </p>
          <p className="text-xs text-muted-foreground mt-1">and climbing...</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="glass-card p-3">
            <p className="text-muted-foreground">What You'll Pay</p>
            <p className="font-semibold text-accent">
              <CountUp 
                end={nextPrice / 100} 
                duration={1500}
                prefix="$"
                decimals={2}
                className="text-green-500 font-bold"
              />
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="text-muted-foreground">Participants</p>
            <p className="font-semibold text-accent">
              {uploadCount}
            </p>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          <p>💡 Each upload increases the price by $0.01</p>
        </div>
      </div>
    </Card>
  );
};

export default PricingDisplay;