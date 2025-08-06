import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LikeButtonProps {
  uploadId: string;
  initialLikes?: number;
  initialDislikes?: number;
}

const LikeButton: React.FC<LikeButtonProps> = ({ 
  uploadId, 
  initialLikes = 0, 
  initialDislikes = 0 
}) => {
  const { toast } = useToast();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get user's IP (simplified approach using localStorage as backup)
  const getUserIP = async () => {
    try {
      // In a real app, you'd get the actual IP from the server
      // For now, we'll use a combination of localStorage and timestamp
      let userId = localStorage.getItem('pixperiment_user_id');
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('pixperiment_user_id', userId);
      }
      return userId;
    } catch {
      return `anonymous_${Date.now()}`;
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
        description: `Vote ${data.action} successfully!`,
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

  return (
    <div className="space-y-2 min-h-[60px]">
      <div className="flex items-center gap-2">
        <Button
          variant={userVote === 'like' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleVote('like')}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs h-7 px-2"
        >
          <ThumbsUp className="w-3 h-3" />
          <span>{likes}</span>
        </Button>
        <Button
          variant={userVote === 'dislike' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleVote('dislike')}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs h-7 px-2"
        >
          <ThumbsDown className="w-3 h-3" />
          <span>{dislikes}</span>
        </Button>
      </div>
      
      {/* Like/Dislike Ratio Bar */}
      {totalVotes > 0 && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{Math.round(likePercentage)}% likes</span>
            <span>{Math.round(100 - likePercentage)}% dislikes</span>
          </div>
          <div className="w-full h-1.5 bg-red-200 dark:bg-red-900/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 dark:bg-green-400 transition-all duration-300 rounded-full"
              style={{ width: `${likePercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LikeButton;