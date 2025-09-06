
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePricing } from '@/hooks/usePricing';

const PredictionPoll: React.FC = () => {
  const { toast } = useToast();
  const { nextPrice, formatPrice } = usePricing();
  const [selectedPrediction, setSelectedPrediction] = useState<{value: number, label: string} | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [predictions, setPredictions] = useState<{[key: number]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [predictionOptions, setPredictionOptions] = useState<Array<{value: number, label: string}>>([]);

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

  const generatePredictionOptions = useCallback(() => {
    // Generate prediction options as price windows/ranges based on current price
    const basePrice = nextPrice;
    const options = [
      { value: basePrice + 25, label: `${formatPrice(basePrice + 1)} - ${formatPrice(basePrice + 50)}` },
      { value: basePrice + 75, label: `${formatPrice(basePrice + 51)} - ${formatPrice(basePrice + 100)}` },  
      { value: basePrice + 150, label: `${formatPrice(basePrice + 101)} - ${formatPrice(basePrice + 200)}` },
      { value: basePrice + 300, label: `${formatPrice(basePrice + 201)} - ${formatPrice(basePrice + 400)}` }
    ];
    setPredictionOptions(options);
  }, [nextPrice, formatPrice]);

  const fetchPredictions = useCallback(async () => {
    try {
      const weekEnding = getNextSunday();
      const { data, error } = await supabase
        .from('predictions')
        .select('predicted_price')
        .eq('week_ending', weekEnding);

      if (error) throw error;

      const counts: {[key: number]: number} = {};
      predictionOptions.forEach(option => counts[option.value] = 0);
      
      data?.forEach(prediction => {
        if (counts[prediction.predicted_price] !== undefined) {
          counts[prediction.predicted_price]++;
        }
      });

      setPredictions(counts);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  }, [predictionOptions]);

  const checkUserVote = useCallback(async () => {
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
        // Find the matching option object for the voted price
        const matchingOption = predictionOptions.find(opt => opt.value === data.predicted_price);
        setSelectedPrediction(matchingOption || null);
        setHasVoted(true);
      }
    } catch (error) {
      console.error('Error checking user vote:', error);
    }
  }, [predictionOptions]);

  useEffect(() => {
    generatePredictionOptions();
  }, [generatePredictionOptions]);

  useEffect(() => {
    if (predictionOptions.length > 0) {
      fetchPredictions();
      checkUserVote();
    }
  }, [predictionOptions, fetchPredictions, checkUserVote]);

  const handleVote = async (option: {value: number, label: string}) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-prediction', {
        body: {
          predictedPrice: option.value  // Send the numeric value to the backend
        }
      });

      if (error) throw error;
      
      // Update local state immediately to show the vote
      setSelectedPrediction(option);
      setHasVoted(true);
      
      // Refresh predictions and user vote status
      await Promise.all([fetchPredictions(), checkUserVote()]);
      
      toast({
        title: "Success!",
        description: `Your prediction has been ${data?.action || 'recorded'}!`,
        duration: 3000, // 3 seconds
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
          Where will the price be by Sunday? (Current: {formatPrice(nextPrice)})
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {predictionOptions.map((option) => {
            const voteCount = predictions[option.value] || 0;
            const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            const isSelected = selectedPrediction?.value === option.value;
            
            return (
              <div key={option.value} className="space-y-2">
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => handleVote(option)}
                  disabled={isLoading}
                  className={`w-full justify-between transition-all duration-200 ${
                    isSelected ? 'bg-purple-600 hover:bg-purple-700 border-purple-600' : ''
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </Button>
                {/* Always show progress bar with vote counts and percentages when someone has voted */}
                {hasVoted && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isSelected ? 'bg-purple-600' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          
          {hasVoted && (
            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Thanks for voting! Total votes: {totalVotes}
              </p>
              <p className="text-xs text-purple-600 font-medium mt-1">
                Your prediction: {selectedPrediction?.label || 'Unknown'} 
                {selectedPrediction && predictions[selectedPrediction.value] ? 
                  ` (${Math.round((predictions[selectedPrediction.value] / totalVotes) * 100)}% agree)` : 
                  ''
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictionPoll;
