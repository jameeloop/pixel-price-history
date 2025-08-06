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

  const predictionOptions = [100, 200, 500, 1000]; // $1, $2, $5, $10 in cents
  
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getNextSunday = () => {
    const today = new Date();
    const daysUntilSunday = 7 - today.getDay();
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + (daysUntilSunday === 7 ? 0 : daysUntilSunday));
    return nextSunday.toISOString().split('T')[0];
  };

  const getUserIP = async () => {
    let userId = localStorage.getItem('pixperiment_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('pixperiment_user_id', userId);
    }
    return userId;
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
    fetchPredictions();
    checkUserVote();
  }, []);

  const handleVote = async (price: number) => {
    if (isLoading || hasVoted) return;
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
        description: `Your prediction has been ${data.action}!`,
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
          Where will the price be by Sunday?
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {predictionOptions.map((price) => {
            const voteCount = predictions[price] || 0;
            const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            const isSelected = selectedPrediction === price;
            
            return (
              <div key={price} className="space-y-1">
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => handleVote(price)}
                  disabled={isLoading || hasVoted}
                  className="w-full justify-between"
                >
                  <span>{formatPrice(price)}</span>
                  <div className="flex items-center gap-2">
                    {hasVoted && (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          {voteCount} votes
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(0)}%
                        </span>
                      </>
                    )}
                  </div>
                </Button>
                {hasVoted && percentage > 0 && (
                  <div className="w-full bg-muted rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-300"
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