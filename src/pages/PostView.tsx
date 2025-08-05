import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Share2, Download, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Upload {
  id: string;
  user_id: string;
  user_email: string;
  image_url: string;
  caption: string;
  price_paid: number;
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
        .from('uploads')
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
    return new Date(dateString).toLocaleDateString();
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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">PixPeriment Post</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Part of the social experiment
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Main Post Card */}
          <div className="space-y-6">
            <Card className="glass-card p-6 experiment-glow">
              <div className="aspect-square rounded-lg overflow-hidden mb-4">
                <img 
                  src={upload.image_url} 
                  alt={upload.caption}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{upload.caption}</h2>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="glass-card p-3">
                    <p className="text-muted-foreground">Price Paid</p>
                    <p className="text-lg font-bold text-primary price-ticker">
                      {formatPrice(upload.price_paid)}
                    </p>
                  </div>
                  <div className="glass-card p-3">
                    <p className="text-muted-foreground">Upload Date</p>
                    <p className="font-medium">{formatDate(upload.created_at)}</p>
                  </div>
                </div>
                
                <div className="glass-card p-3">
                  <p className="text-muted-foreground text-sm">Uploaded by</p>
                  <p className="font-medium">{upload.user_email ? formatEmail(upload.user_email) : 'Anonymous'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sharing Panel */}
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 gradient-text">Share This Post</h3>
              
              {/* QR Code */}
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
                </div>
                <p className="text-sm text-muted-foreground mt-2">Scan to view this post</p>
              </div>

              {/* Copy Link */}
              <div className="mb-6">
                <Button 
                  onClick={copyToClipboard}
                  variant="outline" 
                  className="w-full"
                  size="lg"
                >
                  {copySuccess ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copySuccess ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>

              {/* Social Sharing */}
              <div className="space-y-3">
                <h4 className="font-medium">Share on Social Media</h4>
                <div className="grid grid-cols-1 gap-3">
                  <Button onClick={shareToTwitter} variant="outline" className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </Button>
                  <Button onClick={shareToFacebook} variant="outline" className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on Facebook
                  </Button>
                  <Button onClick={shareToLinkedIn} variant="outline" className="w-full">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on LinkedIn
                  </Button>
                </div>
              </div>
            </Card>

            {/* Experiment Info */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-bold mb-3 gradient-text">About the Experiment</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>🔬 This post is part of PixPeriment's social pricing experiment</p>
                <p>📈 Each upload costs more than the previous one</p>
                <p>🎯 Testing how high the community will push the price</p>
                <p>⚡ Real-time price increases with every new upload</p>
              </div>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full mt-4"
                variant="default"
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