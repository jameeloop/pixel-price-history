import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PricingData {
  current_price: number;
  upload_count: number;
}

interface EnhancedPricingDisplayProps {
  onPriceUpdate: (price: number) => void;
}

const EnhancedPricingDisplay: React.FC<EnhancedPricingDisplayProps> = ({ onPriceUpdate }) => {
  const [pricingData, setPricingData] = useState<PricingData>({ current_price: 50, upload_count: 0 });
  const [totalSpent, setTotalSpent] = useState(0);
  const [lastUploadTime, setLastUploadTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch pricing data
      const { data: pricing, error: pricingError } = await supabase
        .from('pricing')
        .select('current_price, upload_count')
        .single();

      if (pricingError) throw pricingError;

      // Calculate total spent and get last upload time
      const { data: uploads, error: uploadsError } = await supabase
        .from('uploads')
        .select('price_paid, created_at')
        .order('created_at', { ascending: false });

      if (uploadsError) throw uploadsError;

      const total = uploads?.reduce((sum, upload) => sum + upload.price_paid, 0) || 0;
      const lastUpload = uploads?.[0]?.created_at || null;

      if (pricing) {
        setPricingData(pricing);
        onPriceUpdate(pricing.current_price);
      }
      setTotalSpent(total);
      setLastUploadTime(lastUpload);
    } catch (error) {
      console.error('Error fetching enhanced pricing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

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

  if (isLoading) {
    return (
      <Card className="glass-card experiment-glow">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2 mx-auto"></div>
            <div className="h-12 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card experiment-glow text-center">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl gradient-text flex items-center justify-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Experiment Status
        </CardTitle>
        <Badge variant="outline" className="mx-auto w-fit animate-pulse border-primary/50">
          🧪 LIVE EXPERIMENT
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Price - Large Display */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Current Upload Price</p>
          <p className="text-5xl font-bold gradient-text price-ticker">
            {formatPrice(pricingData.current_price)}
          </p>
          <p className="text-xs text-muted-foreground">
            Next victim pays {formatPrice(pricingData.current_price + 1)}
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 space-y-1">
            <div className="flex items-center justify-center gap-1 text-primary">
              <DollarSign className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold">
              {formatPrice(totalSpent)}
            </p>
            <p className="text-xs text-muted-foreground">Total Spent</p>
          </div>
          
          <div className="glass-card p-3 space-y-1">
            <div className="flex items-center justify-center gap-1 text-accent">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold">
              {pricingData.upload_count}
            </p>
            <p className="text-xs text-muted-foreground">Participants</p>
          </div>
          
          <div className="glass-card p-3 space-y-1">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-sm font-semibold">
              {formatTimeAgo(lastUploadTime)}
            </p>
            <p className="text-xs text-muted-foreground">Last Upload</p>
          </div>
        </div>
        
        {/* Psychology Quote */}
        <div className="text-xs text-muted-foreground border-t border-border pt-4 space-y-1">
          <p className="font-medium text-primary">🧠 Psychology Fact:</p>
          <p>"As prices increase, perceived value often increases too - known as the Veblen effect"</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPricingDisplay;