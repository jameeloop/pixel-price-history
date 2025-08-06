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
      const userIP = await getUserIP();

      if (userVote === voteType) {
        // Remove vote
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('upload_id', uploadId)
          .eq('ip_address', userIP);

        if (error) throw error;

        setUserVote(null);
        if (voteType === 'like') {
          setLikes(prev => prev - 1);
        } else {
          setDislikes(prev => prev - 1);
        }
      } else {
        // Add or update vote
        const { error } = await supabase
          .from('likes')
          .upsert({
            upload_id: uploadId,
            ip_address: userIP,
            like_type: voteType
          });

        if (error) throw error;

        // Update counts
        if (userVote === 'like' && voteType === 'dislike') {
          setLikes(prev => prev - 1);
          setDislikes(prev => prev + 1);
        } else if (userVote === 'dislike' && voteType === 'like') {
          setDislikes(prev => prev - 1);
          setLikes(prev => prev + 1);
        } else if (!userVote) {
          if (voteType === 'like') {
            setLikes(prev => prev + 1);
          } else {
            setDislikes(prev => prev + 1);
          }
        }

        setUserVote(voteType);
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={userVote === 'like' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('like')}
        disabled={isLoading}
        className="flex items-center gap-1 text-xs"
      >
        <ThumbsUp className="w-3 h-3" />
        <span>{likes}</span>
      </Button>
      <Button
        variant={userVote === 'dislike' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote('dislike')}
        disabled={isLoading}
        className="flex items-center gap-1 text-xs"
      >
        <ThumbsDown className="w-3 h-3" />
        <span>{dislikes}</span>
      </Button>
    </div>
  );
};

export default LikeButton;