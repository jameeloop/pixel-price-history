import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface RecentUpload {
  user_email: string;
  price_paid: number;
  created_at: string;
  caption: string;
}

const LiveFeed: React.FC = () => {
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [currentPrice, setCurrentPrice] = useState(50);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
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
      // Fetch recent uploads from public view
      const { data: uploads, error: uploadsError } = await supabase
        .from('uploads_public')
        .select('user_email, price_paid, created_at, caption')
        .order('created_at', { ascending: false })
        .limit(5);

      if (uploadsError) throw uploadsError;

      // Fetch current price
      const { data: pricing, error: pricingError } = await supabase
        .from('pricing')
        .select('current_price')
        .single();

      if (pricingError) throw pricingError;

      setRecentUploads(uploads || []);
      setCurrentPrice(pricing?.current_price || 50);
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
  }, []);

  const generateTickerMessage = (upload: RecentUpload) => {
    const timeAgo = formatTimeAgo(upload.created_at);
    const userTag = formatEmail(upload.user_email);
    
    const messages = [
      `${userTag} just uploaded for ${formatPrice(upload.price_paid)} ${timeAgo}`,
      `New upload by ${userTag} • ${formatPrice(upload.price_paid)} paid ${timeAgo}`,
      `${userTag} joined the experiment • ${formatPrice(upload.price_paid)} ${timeAgo}`,
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          📡 Live Activity Feed
          <Badge variant="outline" className="text-xs animate-pulse">
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm font-medium">
              Current Price: <span className="text-primary font-bold">{formatPrice(currentPrice)}</span>
            </p>
          </div>
          
          {recentUploads.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentUploads.map((upload, index) => (
                <div 
                  key={index} 
                  className="text-xs p-2 bg-muted/30 rounded-md text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  {generateTickerMessage(upload)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">
              <p>👀 Waiting for new uploads...</p>
              <p className="text-xs mt-1">Be the first to join the experiment!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveFeed;