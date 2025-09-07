import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Share2, ExternalLink, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LikeButton from '@/components/LikeButton';
import CountUp from '@/components/CountUp';

interface Upload {
  id: string;
  user_email: string;
  image_url: string;
  caption: string;
  price_paid: number;
  upload_order: number;
  created_at: string;
  upvotes?: number;
}

interface CurrentUploadHeroProps {
  refreshTrigger?: number;
}

const CurrentUploadHero: React.FC<CurrentUploadHeroProps> = ({ refreshTrigger }) => {
  const navigate = useNavigate();
  const [currentUpload, setCurrentUpload] = useState<Upload | null>(null);

  useEffect(() => {
    fetchCurrentUpload();
  }, [refreshTrigger]);


  const fetchCurrentUpload = async () => {
    try {
      // Use the get-uploads endpoint to fetch the most recent upload
      const { data, error } = await supabase.functions.invoke('get-uploads', {
        body: { limit: 1, sortBy: 'date', sortOrder: 'desc' }
      });

      if (error) {
        console.error('Error fetching current upload:', error);
        return;
      }

      const uploads = data.uploads || [];
      if (uploads.length > 0) {
        setCurrentUpload(uploads[0]);
      } else {
        setCurrentUpload(null);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };


  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatEmail = (email: string) => {
    if (!email || email.length < 3) return 'Anonymous';
    const [username, domain] = email.split('@');
    if (!username || !domain) return 'Anonymous';
    if (username.length <= 2) return `${username}***`;
    return `${username.substring(0, 2)}${'*'.repeat(Math.max(username.length - 2, 3))}`;
  };


  const handlePostClick = () => {
    if (!currentUpload) return;
    navigate(`/post/${currentUpload.id}`);
  };

  const shareCurrentUpload = () => {
    if (!currentUpload) return;
    const url = `${window.location.origin}/post/${currentUpload.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };


  if (!currentUpload) {
    return (
      <Card className="glass-card mb-8">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <Crown className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Become the First!</h2>
            <p className="text-muted-foreground">
              No one has claimed this space yet. Upload the first photo and own the website!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card experiment-glow border-primary/20 mb-4 sm:mb-8">
      <CardContent className="p-2 sm:p-3 md:p-6">
        <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <h2 className="text-base sm:text-lg md:text-xl font-bold gradient-text">Featured Upload</h2>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
            Latest Upload
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-6">
          {/* Image and Mobile Content */}
          <div className="md:col-span-3 space-y-2 sm:space-y-3">
            {/* Image with mobile upvote button */}
            <div className="flex gap-3 items-start">
              <div className="relative inline-block flex-1 max-w-sm sm:max-w-md mx-auto md:mx-0">
                <div className="w-full h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden">
                  <img
                    src={currentUpload.image_url}
                    alt={currentUpload.caption}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,' + btoa(`
                        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                          <rect width="400" height="300" fill="#f3f4f6"/>
                          <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
                            Featured Upload
                          </text>
                        </svg>
                      `);
                    }}
                  />
                </div>
                <div className="absolute top-0 left-0 z-20">
                  <Badge variant="secondary" className="font-semibold bg-yellow-500/95 text-yellow-900 border-yellow-500/60 shadow-xl backdrop-blur-sm rounded-tl-2xl rounded-br-lg">
                    #{currentUpload.upload_order}
                  </Badge>
                </div>
              </div>
              
              {/* Mobile upvote button and action buttons - right of image */}
              <div className="md:hidden flex-shrink-0 flex flex-col gap-3 mt-4">
                <LikeButton uploadId={currentUpload.id} compact={true} />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handlePostClick}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Post
                  </Button>
                  <Button
                    onClick={shareCurrentUpload}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile metadata buttons - horizontal row */}
            <div className="md:hidden flex gap-1 justify-between text-xs">
              <div className="flex-1 bg-primary/5 border border-primary/10 rounded-lg px-2 py-1.5 text-center">
                <div className="font-medium text-primary">
                  <CountUp 
                    end={currentUpload.price_paid / 100} 
                    duration={1500}
                    prefix="$"
                    decimals={2}
                    className="font-bold"
                  />
                </div>
                <div className="text-xs text-muted-foreground">Paid</div>
              </div>
              <div className="flex-1 bg-primary/5 border border-primary/10 rounded-lg px-2 py-1.5 text-center">
                <div className="font-medium text-primary">
                  {new Date(currentUpload.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-xs text-muted-foreground">Date</div>
              </div>
              <div className="flex-1 bg-primary/5 border border-primary/10 rounded-lg px-2 py-1.5 text-center">
                <div className="font-medium text-primary truncate">
                  {currentUpload.user_email.split('@')[0]}
                </div>
                <div className="text-xs text-muted-foreground">User</div>
              </div>
            </div>

            {/* Action Buttons - Desktop only */}
            <div className="hidden md:flex gap-2">
              <Button
                onClick={handlePostClick}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">View Post</span>
              </Button>
              <Button
                onClick={shareCurrentUpload}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Share</span>
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div>
                <p className="text-sm sm:text-base font-medium break-words leading-relaxed">
                  "{currentUpload.caption}"
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Voting Section and Details */}
          <div className="hidden md:block md:col-span-2 space-y-3 sm:space-y-4">
            <div className="glass-card p-3 sm:p-4">
              <h3 className="text-sm font-medium mb-3 text-center">Community Rating</h3>
              <LikeButton uploadId={currentUpload.id} />
              
              {/* Post Details moved under Community Rating */}
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="glass-card p-3">
                    <p className="text-muted-foreground text-xs">Price Paid</p>
                    <p className="text-lg font-bold text-primary price-ticker">
                      <CountUp 
                        end={currentUpload.price_paid / 100} 
                        duration={1500}
                        prefix="$"
                        decimals={2}
                        className="text-2xl font-bold text-green-500"
                      />
                    </p>
                  </div>
                  <div className="glass-card p-3">
                    <p className="text-muted-foreground text-xs">Uploaded</p>
                    <p className="font-medium text-sm">{formatDate(currentUpload.created_at)}</p>
                  </div>
                  <div className="glass-card p-3">
                    <p className="text-muted-foreground text-xs">Owner</p>
                    <p className="font-medium text-sm">{formatEmail(currentUpload.user_email)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="mt-4 p-3 bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-600/30 rounded-lg shadow-lg relative overflow-hidden cursor-pointer group"
          onClick={() => {
            const uploadSection = document.getElementById('upload-section');
            uploadSection?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-600/10 animate-[pulse_4s_ease-in-out_infinite]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-purple-600/5 animate-[pulse_3s_ease-in-out_infinite_reverse] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <p className="text-sm text-purple-200 text-center font-medium relative z-10">
            🌟 <strong>Want your post here?</strong> This photo claimed the featured space by paying <CountUp 
              end={currentUpload.price_paid / 100} 
              duration={1500}
              prefix="$"
              decimals={2}
              className="text-green-500 font-bold"
            />. 
            <span className="block mt-1 text-purple-300 text-xs relative">
              <span className="inline-block animate-[pulse_4s_ease-in-out_infinite] brightness-110 hover:brightness-125 transition-all duration-300">
                Upload yours to take over! 👑
              </span>
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentUploadHero;