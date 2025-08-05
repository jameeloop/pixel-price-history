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
            <span className="gradient-text experiment-glow">The Social Experiment: How High Can It Go?</span>
          </h2>
          <p className="text-sm text-muted-foreground mb-3 max-w-xl mx-auto">
            A psychological pricing experiment where each photo upload costs more than the last.
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
                <CardTitle className="text-lg">Join the Experiment</CardTitle>
                <p className="text-sm text-muted-foreground">Upload your photo to participate in the social experiment!</p>
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
                <h3 className="text-lg font-bold">Experiment Archive</h3>
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

        {/* FAQ Section - Full version restored */}
        <div className="mt-8 mb-6">
          <Card className="glass-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl gradient-text">Frequently Asked Questions</CardTitle>
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
                  <AccordionContent className="text-left">
                    This experiment explores digital scarcity, social proof, and FOMO (fear of missing out). Early adopters get "cheaper" participation, while later participants pay more but join a more exclusive group. It's fascinating to see how high the community will push the price!
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>Can I upload anything I want?</AccordionTrigger>
                  <AccordionContent>
                    Yes! Whether it's art, memes, personal photos, social media content, or business promotions - all posts are welcome as long as they follow our content guidelines. Express yourself however you'd like!
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                  <AccordionTrigger>Is NSFW content allowed?</AccordionTrigger>
                  <AccordionContent>
                    No, NSFW (Not Safe For Work) content is strictly prohibited. All uploads are public and should be appropriate for all audiences. Any inappropriate content will be removed and may result in account restrictions.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-6 pt-4 border-t border-border/50">
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-medium mb-1">The experiment continues...</p>
            <p className="text-xs">Will you be the one to push the price to new heights? 🚀</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
