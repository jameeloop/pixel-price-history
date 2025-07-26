import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PricingData {
  current_price: number;
  upload_count: number;
}

interface PricingDisplayProps {
  onPriceUpdate: (price: number) => void;
}

const PricingDisplay: React.FC<PricingDisplayProps> = ({ onPriceUpdate }) => {
  const [pricingData, setPricingData] = useState<PricingData>({ current_price: 50, upload_count: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPricing = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing')
        .select('current_price, upload_count')
        .single();

      if (error) {
        console.error('Error fetching pricing:', error);
        return;
      }

      if (data) {
        setPricingData(data);
        onPriceUpdate(data.current_price);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
    
    // Refresh pricing every 30 seconds
    const interval = setInterval(fetchPricing, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  const nextPrice = pricingData.current_price + 1;

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            Current Price
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold gradient-text">
            {formatPrice(pricingData.current_price)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pay this amount to upload now
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Next Price
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">
            {formatPrice(nextPrice)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Price after next upload
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Total Uploads
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-2xl font-bold">
            {pricingData.upload_count}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pictures uploaded so far
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingDisplay;