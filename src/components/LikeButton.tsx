
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
      // Use the get-uploads function to fetch all uploads and find the specific one
      const { data, error } = await supabase.functions.invoke('get-uploads', {
        body: { limit: 1000 } // Get enough uploads to find the specific one
      });

      if (error) {
        // If function fails, set to 0
        setUpvotes(0);
        return;
      }

      const uploads = data.uploads || [];
      const upload = uploads.find(u => u.id === uploadId);
      setUpvotes(upload?.upvotes || 0);
    } catch (error) {
      console.error('Error fetching upvotes:', error);
      setUpvotes(0);
    }
  };

  const checkUserVote = async () => {
    // Since we can't access user_votes table directly due to RLS,
    // we'll let the create-like function handle vote checking
    // and just set userVote to null initially
    setUserVote(null);
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
        // If the function fails, show the actual error for debugging
        console.error('Vote function error:', error);
        toast({
          title: "Vote Error",
          description: error.message || "Failed to process vote. Please try again.",
          variant: "destructive",
          duration: 4000,
        });
        return;
      }

      // Update user vote state based on the action
      if (data?.action === 'created') {
        setUserVote(true);
      } else if (data?.action === 'removed') {
        setUserVote(false);
      }
      
      // Refresh upvotes count
      await fetchUpvotes();
      
      toast({
        title: "Success",
        description: `Vote ${data?.action || 'recorded'} successfully!`,
        duration: 2000, // 2 seconds
      });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Vote Error",
        description: error instanceof Error ? error.message : "Failed to process vote. Please try again.",
        variant: "destructive",
        duration: 4000,
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
          className="flex items-center gap-2 flex-1 justify-center bg-green-500/10 hover:bg-green-500/20 border-green-500/20 text-green-700 dark:text-green-400"
        >
          <ChevronUp className="w-4 h-4" />
          <span className="text-sm">Upvote ({upvotes})</span>
        </Button>
      </div>
      
    </div>
  );
};

export default LikeButton;
