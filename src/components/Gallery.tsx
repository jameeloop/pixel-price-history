import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, Calendar, Search, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LikeButton from '@/components/LikeButton';
import SearchBar from '@/components/SearchBar';
import ImageLightbox from '@/components/ImageLightbox';

interface Upload {
  id: string;
  user_id?: string; // Make optional since uploads_public view doesn't include this
  user_email: string;
  image_url: string;
  caption: string;
  price_paid: number;
  upload_order: number;
  created_at: string;
}

interface GalleryProps {
  refreshTrigger?: number;
  showSearch?: boolean;
  limitResults?: number;
}

const Gallery: React.FC<GalleryProps> = ({ refreshTrigger, showSearch = false, limitResults }) => {
  const navigate = useNavigate();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [filteredUploads, setFilteredUploads] = useState<Upload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);

  const fetchUploads = async () => {
    try {
      let query = supabase
        .from('uploads_public')
        .select('*')
        .order('created_at', { ascending: false });

      if (limitResults) {
        query = query.limit(limitResults);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching uploads:', error);
        return;
      }

      setUploads(data || []);
      setFilteredUploads(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [refreshTrigger, limitResults]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredUploads(uploads);
      return;
    }

    const filtered = uploads.filter(upload => {
      const queryLower = query.toLowerCase();
      
      // Search by caption
      if (upload.caption.toLowerCase().includes(queryLower)) return true;
      
      // Search by price (formatted)
      const priceFormatted = formatPrice(upload.price_paid).toLowerCase();
      if (priceFormatted.includes(queryLower)) return true;
      
      // Search by upload index (position in reverse chronological order)
      const uploadIndex = uploads.findIndex(u => u.id === upload.id) + 1;
      if (uploadIndex.toString().includes(queryLower)) return true;
      
      // Search by raw price value
      if (upload.price_paid.toString().includes(queryLower)) return true;
      
      return false;
    });
    
    setFilteredUploads(filtered);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
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
    if (username.length <= 3) return `Anonymous User`;
    return `${username.substring(0, 2)}***`;
  };

  const truncateCaption = (caption: string, maxLength: number = 120) => {
    return caption.length > maxLength ? `${caption.substring(0, maxLength)}...` : caption;
  };

  const handlePostClick = (uploadId: string) => {
    navigate(`/post/${uploadId}`);
  };

  const handleImageClick = (e: React.MouseEvent, upload: Upload) => {
    e.stopPropagation();
    setSelectedUpload(upload);
    setLightboxOpen(true);
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
      <div>
        {showSearch && (
          <div className="mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>
        )}
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No uploads yet</h3>
            <p className="text-muted-foreground">
              Be the first to join the experiment! 👀
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayUploads = filteredUploads.length > 0 ? filteredUploads : uploads;

  return (
    <div>
      {showSearch && (
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} />
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {displayUploads.length} results for "{searchQuery}"
            </p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {displayUploads.map((upload, index) => (
          <Card 
            key={upload.id} 
            className="glass-card experiment-glow cursor-pointer hover:scale-105 transition-all duration-300 group flex flex-col h-64 sm:h-72 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden" 
            onClick={() => handlePostClick(upload.id)}
          >
            <CardContent className="p-3 sm:p-4 h-full flex flex-col overflow-hidden">
              <div className="relative mb-3 sm:mb-4 flex-shrink-0">
                <img
                  src={upload.image_url}
                  alt={upload.caption}
                  className="w-full h-40 sm:h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onClick={(e) => handleImageClick(e, upload)}
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                      <rect width="400" height="300" fill="#f3f4f6"/>
                      <text x="200" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
                        Image not available
                      </text>
                    </svg>
                  `);
                }}
              />
              <div className="absolute top-2 left-2 flex flex-col sm:flex-row gap-1 sm:gap-2">
                <Badge variant="secondary" className="font-semibold text-xs price-ticker">
                  #{uploads.findIndex(u => u.id === upload.id) + 1}
                </Badge>
                <Badge variant="outline" className="bg-background/90 text-xs price-ticker">
                  {formatPrice(upload.price_paid)}
                </Badge>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/60 text-white p-1 rounded text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Click to preview
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-between space-y-2">
              <p className="text-xs sm:text-sm font-medium line-clamp-2 flex-shrink-0">
                {truncateCaption(upload.caption, 60)}
              </p>
              
              <div className="space-y-2 flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{formatDate(upload.created_at)}</span>
                  </div>
                  <span className="text-xs font-medium text-primary/80">{formatEmail(upload.user_email)}</span>
                </div>
                
                <LikeButton uploadId={upload.id} />
              </div>
            </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Image Lightbox */}
      {selectedUpload && (
        <ImageLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={selectedUpload.image_url}
          caption={selectedUpload.caption}
          uploadOrder={uploads.findIndex(u => u.id === selectedUpload.id) + 1}
          pricePaid={selectedUpload.price_paid}
          uploadDate={selectedUpload.created_at}
          userEmail={selectedUpload.user_email}
        />
      )}
    </div>
  );
};

export default Gallery;