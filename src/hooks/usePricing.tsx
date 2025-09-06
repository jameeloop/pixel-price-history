import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PricingData {
  uploadCount: number;
  nextPrice: number;    // Price for the next upload (what will be paid)
}

export const usePricing = () => {
  const [pricingData, setPricingData] = useState<PricingData>({
    uploadCount: 0,
    nextPrice: 100     // $1.00 for first upload
  });

  const fetchPricing = useCallback(async () => {
    try {
      console.log('=== PRICING HOOK: Fetching pricing from endpoint ===');
      
      // Use the pricing endpoint to get consistent pricing
      const { data, error } = await supabase.functions.invoke('get-pricing');

      if (error) {
        console.error('Error fetching pricing:', error);
        // Set default values even on error
        setPricingData({
          uploadCount: 0,
          nextPrice: 100
        });
        return;
      }

      console.log('=== PRICING FROM ENDPOINT ===', { 
        uploadCount: data.uploadCount,
        nextPrice: data.nextPrice,
        nextPriceDollars: data.nextPriceDollars
      });
      
      // Debug: Log to browser console for debugging
      console.log('🔍 PRICING DEBUG:', {
        uploadCount: data.uploadCount,
        nextPrice: data.nextPrice,
        nextPriceDollars: data.nextPriceDollars
      });
      
      setPricingData({
        uploadCount: data.uploadCount,
        nextPrice: data.nextPrice
      });
    } catch (error) {
      console.error('Error in pricing hook:', error);
      // Set default values on error
      setPricingData({
        uploadCount: 0,
        nextPrice: 100
      });
    }
  }, []);

  useEffect(() => {
    fetchPricing();
    
    // Refresh every 60 seconds to reduce load
    const interval = setInterval(fetchPricing, 60000);
    return () => clearInterval(interval);
  }, [fetchPricing]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return {
    ...pricingData,
    formatPrice,
    refreshPricing: fetchPricing
  };
};
