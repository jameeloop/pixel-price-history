import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePricing } from '@/hooks/usePricing';

interface EnhancedPricingDisplayProps {
  onPriceUpdate: (price: number) => void;
  refreshTrigger?: number;
}

const EnhancedPricingDisplay: React.FC<EnhancedPricingDisplayProps> = ({ onPriceUpdate, refreshTrigger }) => {
  const { uploadCount, nextPrice, formatPrice } = usePricing();
  const [totalSpent, setTotalSpent] = useState(0);
  const [lastUploadTime, setLastUploadTime] = useState<string | null>(null);

  const milestones = [100, 200, 500, 1000, 2000, 5000]; // $1.00, $2.00, $5.00, $10.00, $20.00, $50.00
  
  const getNextMilestone = (price: number) => {
    return milestones.find(milestone => milestone > price) || milestones[milestones.length - 1];
  };
  
  const getPreviousMilestone = (price: number) => {
    const reachedMilestones = milestones.filter(milestone => milestone <= price);
    return reachedMilestones.length > 0 ? reachedMilestones[reachedMilestones.length - 1] : 0;
  };
  
  const getProgressToNextMilestone = (price: number) => {
    const nextMilestone = getNextMilestone(price);
    const prevMilestone = getPreviousMilestone(price);
    const progress = ((price - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
    return Math.min(progress, 100);
  };

  const fetchAdditionalData = async () => {
    try {
      // Use the get-uploads endpoint to fetch uploads data
      const { data, error } = await supabase.functions.invoke('get-uploads', {
        body: {}
      });

      if (error) {
        console.error('Error fetching uploads:', error);
        return;
      }

      const uploads = data.uploads || [];
      const total = uploads.reduce((sum: number, upload: { price_paid?: number }) => sum + (upload.price_paid || 0), 0);
      const lastUpload = uploads[0]?.created_at || null;

      setTotalSpent(total);
      setLastUploadTime(lastUpload);
    } catch (error) {
      console.error('Error fetching additional data:', error);
    }
  };

  useEffect(() => {
    onPriceUpdate(nextPrice); // Pass the next price (what user will pay) to the upload form
  }, [nextPrice, onPriceUpdate]);

  useEffect(() => {
    fetchAdditionalData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAdditionalData, 30000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);


  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const now = new Date();
    const uploadTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - uploadTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };


  return (
    <Card className="glass-card experiment-glow text-center">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg gradient-text flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Experiment Status
        </CardTitle>
        <Badge variant="outline" className="mx-auto w-fit animate-pulse border-primary/50 text-xs">
          🧪 LIVE EXPERIMENT
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Next Upload Price - Smaller Display */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Next Upload Price</p>
          <p className="text-3xl font-bold gradient-text price-ticker">
            {formatPrice(nextPrice || 100)}
          </p>
          <p className="text-xs text-muted-foreground">
            This is what you'll pay
          </p>
        </div>
        
        {/* Stats Grid - Smaller */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card p-2 space-y-1">
            <div className="flex items-center justify-center gap-1 text-primary">
              <DollarSign className="w-3 h-3" />
            </div>
            <p className="text-xs font-semibold">
              {formatPrice(totalSpent)}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Spent</p>
          </div>
          
          <div className="glass-card p-2 space-y-1">
            <div className="flex items-center justify-center gap-1 text-accent">
              <Users className="w-3 h-3" />
            </div>
            <p className="text-xs font-semibold">
              {uploadCount}
            </p>
            <p className="text-[10px] text-muted-foreground">Participants</p>
          </div>
          
          <div className="glass-card p-2 space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
            </div>
            <p className="text-xs font-semibold">
              {formatTimeAgo(lastUploadTime)}
            </p>
            <p className="text-[10px] text-muted-foreground">Last Upload</p>
          </div>
        </div>
        
        {/* Milestone Progress Bar */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress to next milestone</span>
              <span>${(nextPrice / 100).toFixed(2)}</span>
            </div>
            <Progress 
              value={getProgressToNextMilestone(nextPrice)} 
              className="h-2 bg-muted"
            />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                ${(getPreviousMilestone(nextPrice) / 100).toFixed(2)}
              </span>
              <span className="text-primary font-medium">
                ${(getNextMilestone(nextPrice) / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPricingDisplay;