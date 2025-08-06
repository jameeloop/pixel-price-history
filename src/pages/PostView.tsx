import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Share2, Download, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import QRTooltip from '@/components/QRTooltip';
import LikeButton from '@/components/LikeButton';

interface Upload {
  id: string;
  user_email: string;
  image_url: string;
  caption: string;
  price_paid: number;
  upload_order: number;
  created_at: string;
}

const PostView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [upload, setUpload] = useState<Upload | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUpload();
      generateQrCode();
    }
  }, [id]);

  const fetchUpload = async () => {
    try {
      const { data, error } = await supabase
        .from('uploads_public')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setUpload(data);
    } catch (error) {
      console.error('Error fetching upload:', error);
      toast.error('Post not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const generateQrCode = () => {
    const url = window.location.href;
    // Using QR Server API for simplicity
    setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatEmail = (email: string) => {
    const [name, domain] = email.split('@');
    return `${name.substring(0, 2)}***@${domain}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const shareToTwitter = () => {
    const text = `Check out this post on PixPeriment - The Social Experiment! Price paid: ${upload ? formatPrice(upload.price_paid) : ''} 🚀`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`);
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`);
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        {/* Header - Compact */}
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold gradient-text">PixPeriment Post</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Part of the social experiment
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Main Post Card - Smaller */}
          <div className="space-y-4">
            <Card className="glass-card p-4 experiment-glow">
              <div className="aspect-square max-w-md mx-auto rounded-lg overflow-hidden mb-3">
                <img 
                  src={upload.image_url} 
                  alt={upload.caption}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    console.error('Image failed to load:', upload.image_url);
                    console.log('Attempting to load fallback image...');
                    e.currentTarget.src = 'data:image/svg+xml;base64,' + btoa(`
                      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
                        <rect width="400" height="400" fill="#f3f4f6"/>
                        <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
                          ${upload.caption || 'Image not available'}
                        </text>
                      </svg>
                    `);
                  }}
                />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-lg font-semibold break-words">{upload.caption}</h2>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="glass-card p-2">
                    <p className="text-muted-foreground text-xs">Price Paid</p>
                    <p className="text-base font-bold text-primary price-ticker">
                      {formatPrice(upload.price_paid)}
                    </p>
                  </div>
                  <div className="glass-card p-2">
                    <p className="text-muted-foreground text-xs">Upload Date & Time</p>
                    <p className="font-medium text-xs">{formatDate(upload.created_at)}</p>
                  </div>
                </div>
                
                <div className="glass-card p-2">
                  <p className="text-muted-foreground text-xs">Uploaded by</p>
                  <p className="font-medium text-sm">{upload.user_email ? formatEmail(upload.user_email) : 'Anonymous'}</p>
                </div>
                
                {/* Like/Dislike Section */}
                <div className="glass-card p-3">
                  <p className="text-muted-foreground text-xs mb-2">Community Rating</p>
                  <LikeButton uploadId={upload.id} />
                </div>
              </div>
            </Card>
          </div>

          {/* Sharing Panel - Compact */}
          <div className="space-y-4">
            <Card className="glass-card p-4">
              <h3 className="text-lg font-bold mb-3 gradient-text">Share This Post</h3>
              
              {/* QR Code - Smaller */}
              <div className="text-center mb-4">
                <QRTooltip>
                  <div className="inline-block p-2 bg-white rounded-lg cursor-pointer">
                    <img src={qrCode} alt="QR Code" className="w-32 h-32 mx-auto" />
                  </div>
                </QRTooltip>
                <p className="text-xs text-muted-foreground mt-1">Scan to view this post</p>
              </div>

              {/* Copy Link - Compact */}
              <div className="mb-4">
                <Button 
                  onClick={copyToClipboard}
                  variant="outline" 
                  className="w-full"
                  size="sm"
                >
                  {copySuccess ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copySuccess ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>

              {/* Social Sharing - Compact */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Share on Social Media</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={shareToTwitter} variant="outline" className="w-full" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </Button>
                  <Button onClick={shareToFacebook} variant="outline" className="w-full" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on Facebook
                  </Button>
                  <Button onClick={shareToLinkedIn} variant="outline" className="w-full" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on LinkedIn
                  </Button>
                </div>
              </div>
            </Card>

            {/* Experiment Info - Compact */}
            <Card className="glass-card p-4">
              <h3 className="text-base font-bold mb-2 gradient-text">About the Experiment</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>🔬 Part of PixPeriment's social pricing experiment</p>
                <p>📈 Each upload costs more than the previous one</p>
                <p>🎯 Testing how high the community will push the price</p>
                <p>⚡ Real-time price increases with every new upload</p>
              </div>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full mt-3"
                variant="default"
                size="sm"
              >
                Join the Experiment
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostView;