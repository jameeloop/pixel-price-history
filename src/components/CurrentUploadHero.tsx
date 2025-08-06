import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Share2, ExternalLink, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Upload {
  id: string;
  user_id: string;
  user_email: string;
  image_url: string;
  caption: string;
  price_paid: number;
  upload_order: number;
  created_at: string;
}

const CurrentUploadHero: React.FC = () => {
  const navigate = useNavigate();
  const [currentUpload, setCurrentUpload] = useState<Upload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUpload();
  }, []);

  const fetchCurrentUpload = async () => {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching current upload:', error);
        return;
      }

      setCurrentUpload(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
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
    const [username] = email.split('@');
    if (username.length <= 3) return `Anonymous`;
    return `${username.substring(0, 2)}***`;
  };

  const shareCurrentUpload = () => {
    if (!currentUpload) return;
    const url = `${window.location.origin}/post/${currentUpload.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <Card className="glass-card experiment-glow mb-8">
        <CardContent className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="aspect-video bg-muted rounded-lg mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
    <Card className="glass-card experiment-glow mb-8 border-primary/20">
      <CardContent className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl sm:text-2xl font-bold gradient-text">Featured Upload</h2>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Latest Upload
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image and Buttons */}
          <div className="space-y-4">
            <div className="relative">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={currentUpload.image_url}
                  alt={currentUpload.caption}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="font-semibold bg-yellow-500/20 text-yellow-700 border-yellow-500/20">
                  #{currentUpload.upload_order}
                </Badge>
              </div>
            </div>

            {/* Buttons moved under image */}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(`/post/${currentUpload.id}`)}
                variant="outline"
                size="default"
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Post
              </Button>
              <Button
                onClick={shareCurrentUpload}
                variant="outline"
                size="default"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Content - More compact now */}
          <div className="space-y-6">
            <div>
              <p className="text-base sm:text-xl font-medium mb-4 break-words leading-relaxed">
                "{currentUpload.caption}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="glass-card p-4">
                <p className="text-muted-foreground text-sm">Price Paid</p>
                <p className="text-lg sm:text-2xl font-bold text-primary price-ticker">
                  {formatPrice(currentUpload.price_paid)}
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-muted-foreground text-sm">Uploaded</p>
                <p className="font-medium text-base">{formatDate(currentUpload.created_at)}</p>
              </div>
            </div>

            <div className="glass-card p-4">
              <p className="text-muted-foreground text-sm">Owner</p>
              <p className="font-medium text-lg">{formatEmail(currentUpload.user_email)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-600/30 rounded-lg shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-600/10 animate-pulse"></div>
          <p className="text-base text-purple-200 text-center font-medium relative z-10">
            🌟 <strong>Want your post here?</strong> This photo claimed the featured space by paying {formatPrice(currentUpload.price_paid)}. 
            <span className="block mt-1 text-purple-300 animate-bounce">Upload yours to take over! 👑</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentUploadHero;