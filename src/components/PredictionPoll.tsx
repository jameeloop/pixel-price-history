
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PredictionPoll: React.FC = () => {
  const { toast } = useToast();
  const [selectedPrediction, setSelectedPrediction] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [predictions, setPredictions] = useState<{[key: number]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(50);
  const [predictionOptions, setPredictionOptions] = useState<number[]>([]);
  
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getNextSunday = () => {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (daysUntilSunday === 7 ? 0 : daysUntilSunday));
    return nextSunday.toISOString().split('T')[0];
  };

  const getUserIP = async () => {
    try {
      const { getOrCreateSecureUserId } = await import('@/utils/secureIpUtils');
      return getOrCreateSecureUserId();
    } catch {
      // Fallback for legacy users
      let userId = localStorage.getItem('pixperiment_user_id');
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('pixperiment_user_id', userId);
      }
      return userId;
    }
  };

  const fetchCurrentPrice = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing')
        .select('current_price')
        .single();

      if (error) throw error;
      
      if (data) {
        setCurrentPrice(data.current_price);
        // Generate prediction options based on current price
        // Options should be higher than current price
        const basePrice = data.current_price;
        const options = [
          basePrice + 50,   // +$0.50
          basePrice + 100,  // +$1.00
          basePrice + 200,  // +$2.00
          basePrice + 500   // +$5.00
        ];
        setPredictionOptions(options);
      }
    } catch (error) {
      console.error('Error fetching current price:', error);
      // Fallback options if price fetch fails
      setPredictionOptions([100, 200, 500, 1000]);
    }
  };

  const fetchPredictions = async () => {
    try {
      const weekEnding = getNextSunday();
      const { data, error } = await supabase
        .from('predictions')
        .select('predicted_price')
        .eq('week_ending', weekEnding);

      if (error) throw error;

      const counts: {[key: number]: number} = {};
      predictionOptions.forEach(option => counts[option] = 0);
      
      data?.forEach(prediction => {
        if (counts[prediction.predicted_price] !== undefined) {
          counts[prediction.predicted_price]++;
        }
      });

      setPredictions(counts);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const checkUserVote = async () => {
    try {
      const userIP = await getUserIP();
      const weekEnding = getNextSunday();
      
      const { data, error } = await supabase
        .from('predictions')
        .select('predicted_price')
        .eq('ip_address', userIP)
        .eq('week_ending', weekEnding)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSelectedPrediction(data.predicted_price);
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Error checking user vote:', error);
    }
  };

  useEffect(() => {
    fetchCurrentPrice();
  }, []);

  useEffect(() => {
    if (predictionOptions.length > 0) {
      fetchPredictions();
      checkUserVote();
    }
  }, [predictionOptions]);

  const handleVote = async (price: number) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-prediction', {
        body: {
          predictedPrice: price
        }
      });

      if (error) throw error;
      
      // Refresh predictions and user vote status
      await Promise.all([fetchPredictions(), checkUserVote()]);
      
      toast({
        title: "Success!",
        description: `Your prediction has been ${data?.action || 'recorded'}!`,
      });
    } catch (error) {
      console.error('Error submitting prediction:', error);
      toast({
        title: "Error",
        description: "Failed to submit prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalVotes = Object.values(predictions).reduce((sum, count) => sum + count, 0);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🔮 Weekly Prediction Poll
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Where will the price be by Sunday? (Current: {formatPrice(currentPrice)})
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {predictionOptions.map((price) => {
            const voteCount = predictions[price] || 0;
            const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            const isSelected = selectedPrediction === price;
            
            return (
              <div key={price} className="space-y-2">
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => handleVote(price)}
                  disabled={isLoading}
                  className={`w-full justify-between transition-all duration-200 ${
                    isSelected ? 'bg-purple-600 hover:bg-purple-700 border-purple-600' : ''
                  }`}
                >
                  <span>{formatPrice(price)}</span>
                  <div className="flex items-center gap-2">
                    {hasVoted && (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(0)}%
                        </span>
                      </>
                    )}
                  </div>
                </Button>
                {hasVoted && percentage > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isSelected ? 'bg-purple-600' : 'bg-primary'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          
          {hasVoted && (
            <div className="text-center pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Thanks for voting! Total votes: {totalVotes}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictionPoll;
