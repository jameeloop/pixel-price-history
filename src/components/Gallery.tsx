import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Upload {
  id: string;
  user_email: string;
  image_url: string;
  caption: string;
  price_paid: number;
  upload_order: number;
  created_at: string;
}

interface GalleryProps {
  refreshTrigger?: number;
}

const Gallery: React.FC<GalleryProps> = ({ refreshTrigger }) => {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .order('upload_order', { ascending: false });

      if (error) {
        console.error('Error fetching uploads:', error);
        return;
      }

      setUploads(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [refreshTrigger]);

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatEmail = (email: string) => {
    const [username, domain] = email.split('@');
    if (username.length <= 3) return email;
    return `${username.substring(0, 3)}***@${domain}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-4">
              <Skeleton className="w-full h-48 rounded-lg mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (uploads.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
          <p className="text-muted-foreground">
            Be the first to upload a picture!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {uploads.map((upload, index) => (
        <Card key={upload.id} className="glass-card hover:glow-shadow transition-all duration-300">
          <CardContent className="p-4">
            <div className="relative mb-4">
              <img
                src={upload.image_url}
                alt={upload.caption}
                className="w-full h-48 object-cover rounded-lg"
                loading="lazy"
              />
              <div className="absolute top-2 left-2 flex gap-2">
                <Badge variant="secondary" className="font-semibold">
                  #{uploads.length - index}
                </Badge>
                <Badge variant="outline" className="bg-background/80">
                  {formatPrice(upload.price_paid)}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-medium line-clamp-2">
                {upload.caption}
              </p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(upload.created_at)}
                </div>
                <span>{formatEmail(upload.user_email)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Gallery;