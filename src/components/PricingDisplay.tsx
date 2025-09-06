import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Camera } from 'lucide-react';
import { usePricing } from '@/hooks/usePricing';

interface PricingDisplayProps {
  onPriceUpdate: (price: number) => void;
}

const PricingDisplay: React.FC<PricingDisplayProps> = ({ onPriceUpdate }) => {
  const { uploadCount, currentPrice, nextPrice, isLoading, formatPrice } = usePricing();

  useEffect(() => {
    onPriceUpdate(nextPrice); // Pass the next price (what user will pay) to the upload form
  }, [nextPrice, onPriceUpdate]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="glass-card experiment-glow text-center p-6">
      <h3 className="text-xl font-semibold mb-2">The Experiment Status</h3>
      <p className="text-sm text-muted-foreground mb-4">How high will the community push it? 🚀</p>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Price</p>
          <p className="text-4xl font-bold gradient-text price-ticker">
            {formatPrice(currentPrice)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">and climbing...</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="glass-card p-3">
            <p className="text-muted-foreground">Next Victim Pays</p>
            <p className="font-semibold text-accent">
              {formatPrice(nextPrice)}
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