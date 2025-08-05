import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History, Camera, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadForm from '@/components/UploadForm';
import PricingDisplay from '@/components/PricingDisplay';
import Gallery from '@/components/Gallery';
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
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center experiment-glow">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">PixPeriment</h1>
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
      <div className="container mx-auto px-4 py-4">
        {/* Hero Section - Condensed for viewport fit */}
        <div className="text-center mb-6 relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            The Social Experiment:{" "}
            <span className="gradient-text experiment-glow">How High Can It Go?</span>
          </h2>
          <p className="text-base text-muted-foreground mb-4 max-w-2xl mx-auto">
            Welcome to PixPeriment - a psychological pricing experiment where each photo upload costs more than the last.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground mb-4">
            <span className="glass-card px-2 py-1">📈 Escalating Prices</span>
            <span className="glass-card px-2 py-1">🔬 Social Experiment</span>
            <span className="glass-card px-2 py-1">⚡ Real-time Updates</span>
          </div>
        </div>

        {/* Pricing Display */}
        <div className="mb-6">
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

        {/* FAQ Section */}
        <div className="mt-12 mb-8">
          <Card className="glass-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl gradient-text">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>How does the pricing experiment work?</AccordionTrigger>
                  <AccordionContent>
                    PixPeriment starts at $0.50 for the first upload. Each time someone uploads a photo, the price increases by $0.01 for the next person. This creates an escalating cost structure that tests social psychology and digital scarcity.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What happens after I upload a photo?</AccordionTrigger>
                  <AccordionContent>
                    Your photo will be processed and added to the public gallery. You'll receive an email confirmation and a unique link to share your contribution. The price automatically increases for the next participant.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Is my email address kept private?</AccordionTrigger>
                  <AccordionContent>
                    Yes! Your email is only used for confirmation and processing. In the gallery, we show only the first two letters followed by asterisks to maintain privacy while ensuring transparency.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Can I upload multiple photos?</AccordionTrigger>
                  <AccordionContent>
                    Absolutely! You can upload as many photos as you want, but each upload will cost the current price at that moment. The more you participate, the higher the price goes for everyone.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>What's the psychology behind this experiment?</AccordionTrigger>
                  <AccordionContent>
                    This experiment explores digital scarcity, social proof, and FOMO (fear of missing out). Early adopters get "cheaper" participation, while later participants pay more but join a more exclusive group. It's fascinating to see how high the community will push the price!
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-8 border-t border-border/50">
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
