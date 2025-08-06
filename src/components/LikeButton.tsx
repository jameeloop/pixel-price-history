
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LikeButtonProps {
  uploadId: string;
  initialLikes?: number;
  initialDislikes?: number;
  compact?: boolean; // For experiment archive
}

const LikeButton: React.FC<LikeButtonProps> = ({ 
  uploadId, 
  initialLikes = 0, 
  initialDislikes = 0,
  compact = false
}) => {
  const { toast } = useToast();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
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

  const fetchLikeCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('like_type')
        .eq('upload_id', uploadId);

      if (error) throw error;

      const likesCount = data?.filter(like => like.like_type === 'like').length || 0;
      const dislikesCount = data?.filter(like => like.like_type === 'dislike').length || 0;

      setLikes(likesCount);
      setDislikes(dislikesCount);
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const checkUserVote = async () => {
    try {
      const userIP = await getUserIP();
      const { data, error } = await supabase
        .from('likes')
        .select('like_type')
        .eq('upload_id', uploadId)
        .eq('ip_address', userIP)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setUserVote((data?.like_type as 'like' | 'dislike') || null);
    } catch (error) {
      console.error('Error checking user vote:', error);
    }
  };

  useEffect(() => {
    fetchLikeCounts();
    checkUserVote();
  }, [uploadId]);

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-like', {
        body: {
          uploadId,
          likeType: voteType
        }
      });

      if (error) throw error;

      // Refresh vote counts and user vote status
      await Promise.all([fetchLikeCounts(), checkUserVote()]);
      
      toast({
        title: "Success",
        description: `Vote ${data?.action || 'recorded'} successfully!`,
        duration: 2000, // 2 seconds
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error", 
        description: "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalVotes = likes + dislikes;
  const likePercentage = totalVotes > 0 ? (likes / totalVotes) * 100 : 50;

  // Compact version for experiment archive
  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <Button
          variant={userVote === 'like' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleVote('like')}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs h-7 px-2 bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-700 dark:text-green-400"
        >
          <ChevronUp className="w-3 h-3" />
          <span>{likes}</span>
        </Button>
        <Button
          variant={userVote === 'dislike' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleVote('dislike')}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs h-7 px-2 bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-700 dark:text-red-400"
        >
          <ChevronDown className="w-3 h-3" />
          <span>{dislikes}</span>
        </Button>
      </div>
    );
  }

  // Full version for featured posts
  return (
    <div className="space-y-3 w-full">
      {/* Horizontal Buttons */}
      <div className="flex gap-2 w-full">
        <Button
          variant={userVote === 'like' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleVote('like')}
          disabled={isLoading}
          className="flex items-center gap-2 flex-1 justify-center"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm">Like ({likes})</span>
        </Button>
        <Button
          variant={userVote === 'dislike' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleVote('dislike')}
          disabled={isLoading}
          className="flex items-center gap-2 flex-1 justify-center"
        >
          <ChevronDown className="w-4 h-4" />
          <span className="text-sm">Dislike ({dislikes})</span>
        </Button>
      </div>
      
      {/* Bigger Like/Dislike Ratio Bar */}
      {totalVotes > 0 && (
        <div className="w-full">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span className="font-medium">{Math.round(likePercentage)}% Like</span>
            <span className="font-medium">{Math.round(100 - likePercentage)}% Dislike</span>
          </div>
          <div className="w-full h-3 bg-red-200 dark:bg-red-900/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 dark:bg-green-400 transition-all duration-500 rounded-full"
              style={{ width: `${likePercentage}%` }}
            />
          </div>
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">
              {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LikeButton;
