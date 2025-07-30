import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History, Camera, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadForm from '@/components/UploadForm';
import PricingDisplay from '@/components/PricingDisplay';
import Gallery from '@/components/Gallery';

const Index = () => {
  const navigate = useNavigate();
  const [currentPrice, setCurrentPrice] = useState(50);
  const [refreshGallery, setRefreshGallery] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshGallery(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">PicShare</h1>
                <p className="text-xs text-muted-foreground">Dynamic pricing picture uploads</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/history')}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Gallery
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
            Share Your Moment
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Upload your picture with a caption for a small fee. Each upload increases the price by 1p, 
            creating a unique community-driven gallery.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>Price increases with each upload</span>
          </div>
        </div>

        {/* Pricing Display */}
        <div className="mb-8">
          <PricingDisplay onPriceUpdate={setCurrentPrice} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <UploadForm 
              currentPrice={currentPrice} 
              onUploadSuccess={handleUploadSuccess}
            />
          </div>

          {/* Recent Uploads Preview */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Recent Uploads</h3>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/history')}
                  className="text-primary hover:text-primary/80"
                >
                  View All
                </Button>
              </div>
            </div>
            <Gallery refreshTrigger={refreshGallery} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/50">
          <div className="text-center text-sm text-muted-foreground">
            <p>Upload pictures, build community, increase value with each contribution.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
