import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PricingData {
  uploadCount: number;
  currentPrice: number; // Price of the last upload (what was paid)
  nextPrice: number;    // Price for the next upload (what will be paid)
}

export const usePricing = () => {
  const [pricingData, setPricingData] = useState<PricingData>({
    uploadCount: 0,
    currentPrice: 100, // $1.00 for first upload
    nextPrice: 100     // $1.00 for first upload
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPricing = async () => {
    try {
      console.log('=== PRICING HOOK: Fetching upload count ===');
      
      // Get upload count - single source of truth
      const { count: uploadCount, error } = await supabase
        .from('uploads')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching uploads:', error);
        return;
      }

      // Single variable - everything based on this
      const currentUploadCount = uploadCount || 0;
      
      // Price calculations - all based on currentUploadCount
      const currentPrice = 100 + currentUploadCount; // Current upload price
      const nextPrice = currentPrice + 1; // Next upload will be 1 cent more
      
      console.log('=== SIMPLIFIED PRICING HOOK ===', { 
        uploadCount,
        currentUploadCount,
        currentPrice,
        nextPrice,
        currentPriceDollars: (currentPrice / 100).toFixed(2),
        nextPriceDollars: (nextPrice / 100).toFixed(2)
      });
      
      setPricingData({
        uploadCount: currentUploadCount,
        currentPrice,
        nextPrice
      });
    } catch (error) {
      console.error('Error in pricing hook:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPricing, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return {
    ...pricingData,
    isLoading,
    formatPrice,
    refreshPricing: fetchPricing
  };
};
