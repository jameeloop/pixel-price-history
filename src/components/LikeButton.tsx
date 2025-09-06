
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LikeButtonProps {
  uploadId: string;
  initialUpvotes?: number;
  compact?: boolean; // For experiment archive
}

const LikeButton: React.FC<LikeButtonProps> = ({ 
  uploadId, 
  initialUpvotes = 0,
  compact = false
}) => {
  const { toast } = useToast();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get secure user identifier
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

  const fetchUpvotes = async () => {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('upvotes')
        .eq('id', uploadId)
        .single();

      if (error) {
        // If upvotes column doesn't exist, set to 0
        setUpvotes(0);
        return;
      }

      setUpvotes(data?.upvotes || 0);
    } catch (error) {
      console.error('Error fetching upvotes:', error);
      setUpvotes(0);
    }
  };

  const checkUserVote = async () => {
    try {
      const userIP = await getUserIP();
      const { data, error } = await supabase
        .from('user_votes')
        .select('voted')
        .eq('upload_id', uploadId)
        .eq('user_ip', userIP)
        .single();

      if (error && error.code !== 'PGRST116') {
        // If user_votes table doesn't exist, set to null
        setUserVote(null);
        return;
      }
      
      setUserVote(data?.voted || null);
    } catch (error) {
      console.error('Error checking user vote:', error);
      setUserVote(null);
    }
  };

  useEffect(() => {
    fetchUpvotes();
    checkUserVote();
  }, [uploadId]);

  const handleVote = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const userIP = await getUserIP();
      const { data, error } = await supabase.functions.invoke('create-like', {
        body: {
          uploadId,
          userIP
        }
      });

      if (error) {
        // If the function fails (e.g., upvotes column doesn't exist), show a message
        toast({
          title: "Coming Soon",
          description: "Voting feature will be available soon!",
          duration: 2000,
        });
        return;
      }

      // Refresh upvotes and user vote status
      await Promise.all([fetchUpvotes(), checkUserVote()]);
      
      toast({
        title: "Success",
        description: `Vote ${data?.action || 'recorded'} successfully!`,
        duration: 2000, // 2 seconds
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Coming Soon",
        description: "Voting feature will be available soon!",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Compact version for experiment archive
  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <Button
          variant={userVote ? 'default' : 'outline'}
          size="sm"
          onClick={handleVote}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs h-7 px-2 bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-700 dark:text-green-400"
        >
          <ChevronUp className="w-3 h-3" />
          <span>{upvotes}</span>
        </Button>
      </div>
    );
  }

  // Full version for featured posts
  return (
    <div className="space-y-3 w-full">
      {/* Upvote Button */}
      <div className="flex gap-2 w-full">
        <Button
          variant={userVote ? 'default' : 'outline'}
          size="sm"
          onClick={handleVote}
          disabled={isLoading}
          className="flex items-center gap-2 flex-1 justify-center"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm">Upvote ({upvotes})</span>
        </Button>
      </div>
      
      {/* Vote count display */}
      {upvotes > 0 && (
        <div className="w-full text-center">
          <span className="text-xs text-muted-foreground">
            {upvotes} {upvotes === 1 ? 'upvote' : 'upvotes'}
          </span>
        </div>
      )}
    </div>
  );
};

export default LikeButton;
