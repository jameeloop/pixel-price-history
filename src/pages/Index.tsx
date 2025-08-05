import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History, Camera, TrendingUp, Instagram, Music, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadForm from '@/components/UploadForm';
import PricingDisplay from '@/components/PricingDisplay';
import Gallery from '@/components/Gallery';
import CurrentUploadHero from '@/components/CurrentUploadHero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Index = () => {
  const navigate = useNavigate();
  const [currentPrice, setCurrentPrice] = useState(50);
  const [refreshGallery, setRefreshGallery] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshGallery(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Smaller */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center experiment-glow">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">PixPeriment</h1>
                <p className="text-xs text-muted-foreground">Social Experiment</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open('https://instagram.com/pixperiment', '_blank')}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Instagram className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open('https://tiktok.com/@pixperiment', '_blank')}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Music className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.open('mailto:hello@pixperiment.com', '_blank')}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Mail className="w-4 h-4" />
                </Button>
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
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-3">
        {/* Hero Section - Much more compact */}
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            <span className="gradient-text experiment-glow">Who Owns PixPeriment Right Now?</span>
          </h2>
          <p className="text-sm text-muted-foreground mb-3 max-w-xl mx-auto">
            Each upload "rents" the main space until someone pays more. The experiment continues...
          </p>
        </div>

        {/* Current Upload Hero */}
        <CurrentUploadHero />

        {/* Pricing Display - Compact */}
        <div className="mb-4">
          <PricingDisplay onPriceUpdate={setCurrentPrice} />
        </div>

        {/* Main Content Grid - More compact */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Upload Form */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Claim This Space</CardTitle>
                <p className="text-sm text-muted-foreground">Upload your photo to own the website!</p>
              </CardHeader>
              <CardContent className="pt-0">
                <UploadForm 
                  currentPrice={currentPrice} 
                  onUploadSuccess={handleUploadSuccess}
                />
              </CardContent>
            </Card>
          </div>

          {/* Archive Preview */}
          <div className="lg:col-span-3">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">Previous Owners Archive</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/history')}
                  className="text-primary hover:text-primary/80"
                >
                  View All
                </Button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <Gallery refreshTrigger={refreshGallery} />
            </div>
          </div>
        </div>

        {/* FAQ Section - Compact */}
        <div className="mt-8 mb-6">
          <Card className="glass-card">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg gradient-text">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-primary mb-1">🏆 Claim Ownership</h4>
                    <p className="text-muted-foreground">Upload a photo to feature prominently on the main site</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-1">📈 Price Increases</h4>
                    <p className="text-muted-foreground">Each upload costs $0.01 more than the previous</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-primary mb-1">⏰ Temporary Fame</h4>
                    <p className="text-muted-foreground">Own the space until someone pays more</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-1">🗄️ Archive Forever</h4>
                    <p className="text-muted-foreground">All uploads preserved in the gallery</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer - Compact */}
        <footer className="mt-6 pt-4 border-t border-border/50">
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-medium">The experiment continues... 🚀</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
