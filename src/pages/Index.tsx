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
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center experiment-glow">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">PicMint</h1>
                <p className="text-xs text-muted-foreground">The Social Experiment</p>
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
        <div className="text-center mb-12 relative">
          <div className="floating-orb w-32 h-32 top-10 left-1/4"></div>
          <div className="floating-orb w-24 h-24 top-32 right-1/3"></div>
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            The Social Experiment:{" "}
            <span className="gradient-text experiment-glow">How High Can It Go?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Welcome to PicMint - a psychological pricing experiment where each photo upload costs more than the last. 
            Will you pay to be part of digital history? How high will the community push the price?
          </p>
          <div className="glass-card p-6 mb-8 max-w-2xl mx-auto">
            <p className="text-primary font-semibold mb-2">🧠 The Psychology</p>
            <p className="text-sm text-muted-foreground">
              Early adopters pay less • Scarcity creates value • Social proof drives participation • 
              Watch the experiment unfold in real-time
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="glass-card px-3 py-1">📈 Escalating Prices</span>
            <span className="glass-card px-3 py-1">🔬 Social Experiment</span>
            <span className="glass-card px-3 py-1">⚡ Real-time Updates</span>
            <span className="glass-card px-3 py-1">🎯 Digital Scarcity</span>
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
            <p className="text-lg font-medium mb-2">The experiment continues...</p>
            <p className="text-sm">Will you be the one to push the price to new heights? 🚀</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
