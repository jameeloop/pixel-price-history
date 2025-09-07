import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Calendar, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LikeButton from '@/components/LikeButton';
import SearchBar from '@/components/SearchBar';

interface Upload {
  id: string;
  user_id?: string; // Make optional since uploads_public view doesn't include this
  user_email: string;
  image_url: string;
  caption: string;
  price_paid: number;
  upload_order: number;
  created_at: string;
  upvotes?: number;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'index' | 'votes'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchUploads = async () => {
    try {
      // Use the get-uploads endpoint to fetch uploads
      const { data, error } = await supabase.functions.invoke('get-uploads', {
        body: {
          limit: limitResults || undefined,
          search: searchQuery || undefined,
          sortBy: sortBy,
          sortOrder: sortOrder
        }
      });

      if (error) {
        console.error('Error fetching uploads:', error);
        return;
      }

      const uploadsData = data.uploads || [];
      setUploads(uploadsData);
      setFilteredUploads(uploadsData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [refreshTrigger, limitResults, searchQuery, sortBy, sortOrder]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    // Call fetchUploads with the search query
    await fetchUploads();
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
    if (!email || email.length < 3) return 'Anonymous User';
    const [username, domain] = email.split('@');
    if (!username || !domain) return 'Anonymous User';
    if (username.length <= 2) return `${username}***`;
    return `${username.substring(0, 2)}${'*'.repeat(Math.max(username.length - 2, 3))}`;
  };


  const truncateCaption = (caption: string, maxLength: number = 120) => {
    return caption.length > maxLength ? `${caption.substring(0, maxLength)}...` : caption;
  };

  const handlePostClick = (uploadId: string) => {
    navigate(`/post/${uploadId}`);
  };



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

  const allUploads = filteredUploads.length > 0 ? filteredUploads : uploads;
  // Only limit to specified number if limitResults is specified (for homepage), otherwise show all
  // Use responsive limits: 6 on mobile, 5 on desktop when limitResults is 6
  const actualLimit = limitResults === 6 ? (isMobile ? 6 : 5) : limitResults;
  const displayUploads = actualLimit ? allUploads.slice(0, actualLimit) : allUploads;

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
      
      {/* Sorting Controls */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm font-medium text-muted-foreground">Sort by:</label>
            <Select value={sortBy} onValueChange={(value: 'date' | 'index' | 'votes') => setSortBy(value)}>
              <SelectTrigger className="w-24 sm:w-32 h-8 text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="index">Index</SelectItem>
                <SelectItem value="votes">Votes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs sm:text-sm font-medium text-muted-foreground">Order:</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 sm:gap-2 h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />}
              <span className="hidden sm:inline">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
              <span className="sm:hidden">{sortOrder === 'asc' ? 'Asc' : 'Desc'}</span>
            </Button>
          </div>
        </div>
        
      </div>
      
      <div className={`grid gap-2 sm:gap-3 md:gap-4 ${limitResults === 6 ? 'grid-cols-3 sm:grid-cols-3 md:grid-cols-5' : actualLimit === 5 ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5' : limitResults ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'}`}>
        {displayUploads.map((upload, index) => (
            <Card 
            key={upload.id} 
            className="glass-card experiment-glow cursor-pointer hover:scale-105 transition-all duration-300 group h-56 sm:h-64 md:h-72 hover:shadow-2xl hover:shadow-primary/20 overflow-hidden" 
            onClick={() => handlePostClick(upload.id)}
          >
            <CardContent className="p-2 sm:p-3 md:p-4 h-full flex flex-col">
              <div className="relative mb-2 sm:mb-3 md:mb-4 flex-shrink-0 flex gap-1 sm:gap-2">
                <div className="flex-1 overflow-hidden rounded-lg">
                  <img
                    src={upload.image_url}
                    alt={upload.caption}
                    className="w-full h-24 sm:h-32 md:h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
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
                </div>
                
                {/* Price and voting buttons on the right side */}
                <div className="flex-shrink-0 w-16 flex flex-col justify-start gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Price badge */}
                  <Badge variant="outline" className="bg-white text-black font-semibold text-xs price-ticker shadow-sm border w-full justify-center">
                    {formatPrice(upload.price_paid)}
                  </Badge>
                  {/* Voting buttons */}
                  <LikeButton uploadId={upload.id} compact={true} />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="flex-1 mb-3">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed break-words overflow-hidden display-text">
                    {truncateCaption(upload.caption, 60)}
                  </p>
                </div>
                
                <div className="space-y-2 flex-shrink-0">
                  {/* Mobile: Stack date and user vertically */}
                  <div className="sm:hidden space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{formatDate(upload.created_at)}</span>
                    </div>
                    <div className="text-xs font-medium text-primary/80 truncate">
                      {formatEmail(upload.user_email)}
                    </div>
                  </div>
                  {/* Desktop: Keep inline */}
                  <div className="hidden sm:flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{formatDate(upload.created_at)}</span>
                    </div>
                    <span className="text-xs font-medium text-primary/80 truncate max-w-[60px]">{formatEmail(upload.user_email)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default Gallery;