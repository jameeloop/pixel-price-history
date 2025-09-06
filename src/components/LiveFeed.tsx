import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { usePricing } from '@/hooks/usePricing';
import CountUp from '@/components/CountUp';

interface RecentUpload {
  user_email: string;
  price_paid: number;
  created_at: string;
  caption: string;
}

interface LiveFeedProps {
  refreshTrigger?: number;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ refreshTrigger }) => {
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const { nextPrice, formatPrice } = usePricing();
  
  const formatEmail = (email: string) => {
    const [username] = email.split('@');
    if (username.length <= 3) return 'an***';
    return `${username.substring(0, 2)}***`;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const uploadTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - uploadTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const fetchRecentData = async () => {
    try {
      // Use the get-uploads endpoint to fetch recent uploads
      const { data, error } = await supabase.functions.invoke('get-uploads', {
        body: { limit: 5 }
      });

      if (error) throw error;

      const uploads = data.uploads || [];
      setRecentUploads(uploads);
    } catch (error) {
      console.error('Error fetching live feed data:', error);
    }
  };

  useEffect(() => {
    fetchRecentData();
    
    // Set up real-time subscription for new uploads
    const uploadsChannel = supabase
      .channel('uploads-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'uploads'
        },
        () => {
          console.log('New upload detected, refreshing feed...');
          fetchRecentData();
        }
      )
      .subscribe();
    
    // Update every 20 seconds as backup
    const interval = setInterval(fetchRecentData, 20000);
    
    return () => {
      supabase.removeChannel(uploadsChannel);
      clearInterval(interval);
    };
  }, [refreshTrigger]);

  const generateTickerMessage = (upload: RecentUpload) => {
    const timeAgo = formatTimeAgo(upload.created_at);
    const userTag = formatEmail(upload.user_email);
    
    const messages = [
      `${userTag} just uploaded for $${(upload.price_paid / 100).toFixed(2)} ${timeAgo}`,
      `New upload by ${userTag} • $${(upload.price_paid / 100).toFixed(2)} paid ${timeAgo}`,
      `${userTag} joined the experiment • $${(upload.price_paid / 100).toFixed(2)} ${timeAgo}`,
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          📡 Live Feed
          <Badge variant="outline" className="text-xs animate-pulse">
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-center p-2 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs font-medium">
              Current: <span className="text-primary font-bold">
                <CountUp 
                  end={nextPrice / 100} 
                  duration={1500}
                  prefix="$"
                  decimals={2}
                  className="text-green-500 font-bold"
                />
              </span>
            </p>
          </div>
          
          {recentUploads.length > 0 ? (
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {recentUploads.map((upload, index) => (
                <div 
                  key={index} 
                  className="text-xs p-1.5 bg-muted/30 rounded text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  {generateTickerMessage(upload)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-xs text-muted-foreground py-2">
              <p>👀 Waiting for uploads...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveFeed;