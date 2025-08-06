import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History, Camera, TrendingUp, Instagram, Music, Mail, ArrowDownCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UploadForm from '@/components/UploadForm';
import PricingDisplay from '@/components/PricingDisplay';
import EnhancedPricingDisplay from '@/components/EnhancedPricingDisplay';
import Gallery from '@/components/Gallery';
import CurrentUploadHero from '@/components/CurrentUploadHero';
import ProgressMilestones from '@/components/ProgressMilestones';
import LiveFeed from '@/components/LiveFeed';
import PredictionPoll from '@/components/PredictionPoll';
import FloatingUploadCTA from '@/components/FloatingUploadCTA';
import PsychologyFactsBox from '@/components/PsychologyFactsBox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const Index = () => {
  const navigate = useNavigate();
  const [currentPrice, setCurrentPrice] = useState(50);
  const [refreshGallery, setRefreshGallery] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshGallery(prev => prev + 1);
  };

  const scrollToUpload = () => {
    document.getElementById('upload-form')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    });
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
                <h1 className="text-lg font-bold gradient-text">The PixPeriment</h1>
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
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/history')}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                >
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Gallery</span>
                  📸
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/control')}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Control</span>
                  ⚙️
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-3">
        {/* Hero Section - Much more compact */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            <span className="gradient-text experiment-glow">The Social Experiment: How High Can It Go? 🚀</span>
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xl mx-auto">
            A psychological pricing experiment where each photo upload costs more than the last 📈
          </p>
          <div className="glass-card max-w-2xl mx-auto p-3 bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-600/30">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-purple-200">
              <span className="flex items-center gap-1">💰 Price increases with each upload</span>
              <span className="hidden sm:inline text-purple-400">•</span>
              <span className="flex items-center gap-1">🧠 Testing social psychology</span>
              <span className="hidden sm:inline text-purple-400">•</span>
              <span className="flex items-center gap-1">🎯 Digital scarcity experiment</span>
            </div>
          </div>
        </div>

        {/* Swapped Layout: Featured Upload left, Experiment Status right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 lg:order-1">
            <CurrentUploadHero />
          </div>
          <div className="lg:order-2">
            <EnhancedPricingDisplay onPriceUpdate={setCurrentPrice} />
          </div>
        </div>

        {/* Psychology Facts Box - Separate from Experiment Status */}
        <div className="mb-6">
          <PsychologyFactsBox />
        </div>

        {/* Upload Form - Moved up for better accessibility */}
        <div className="mb-6">
          <Card className="glass-card border-2 border-primary/20 bg-gradient-to-r from-purple-50/5 to-purple-100/5" id="upload-form">
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-xl gradient-text">🎨 Join the Experiment</CardTitle>
              <p className="text-sm text-muted-foreground">Upload your photo to participate in the social experiment! ✨</p>
            </CardHeader>
            <CardContent className="pt-0">
              <UploadForm 
                currentPrice={currentPrice} 
                onUploadSuccess={handleUploadSuccess}
              />
            </CardContent>
          </Card>
        </div>

        {/* Progress Milestones - Made smaller */}
        <div className="mb-4">
          <ProgressMilestones currentPrice={currentPrice} />
        </div>

        {/* Live Feed and Prediction Poll - Made smaller */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="lg:col-span-1">
            <LiveFeed />
          </div>
          <div className="lg:col-span-1">
            <PredictionPoll />
          </div>
        </div>

        {/* Archive Preview - Simplified */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold gradient-text">Experiment Archive 📚</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/history')}
              className="text-primary hover:text-primary/80"
            >
              View All →
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto relative">
            <Gallery refreshTrigger={refreshGallery} limitResults={4} />
            <div className="md:hidden absolute bottom-2 right-2 animate-bounce">
              <ArrowDownCircle className="w-5 h-5 text-muted-foreground/50" />
            </div>
          </div>
        </div>

        {/* FAQ Section - Made more compact */}
        <div className="mt-6 mb-6">
          <Card className="glass-card">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg gradient-text">FAQ 💭</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>How does the pricing experiment work? 🤔</AccordionTrigger>
                  <AccordionContent>
                    PixPeriment starts at $0.50 for the first upload 💸. Each time someone uploads a photo, the price increases by $0.01 for the next person. This creates an escalating cost structure that tests social psychology and digital scarcity 📊.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What happens after I upload a photo? 📤</AccordionTrigger>
                  <AccordionContent>
                    Your photo will be processed and added to the public gallery 🖼️. You'll receive an email confirmation and a unique link to share your contribution 📧. The price automatically increases for the next participant 📈.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Is my email address kept private? 🔒</AccordionTrigger>
                  <AccordionContent>
                    Yes! Your email is only used for confirmation and processing 📧. In the gallery, we show only the first two letters followed by asterisks to maintain privacy while ensuring transparency 🛡️.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Can I upload multiple photos? 📸📸</AccordionTrigger>
                  <AccordionContent>
                    Absolutely! You can upload as many photos as you want, but each upload will cost the current price at that moment 💰. The more you participate, the higher the price goes for everyone 📈.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">What's the psychology behind this experiment? 🧠</AccordionTrigger>
                  <AccordionContent className="text-left">
                    This experiment explores digital scarcity, social proof, and FOMO (fear of missing out) 😰. Early adopters get "cheaper" participation, while later participants pay more but join a more exclusive group 👑. It's fascinating to see how high the community will push the price! 🚀
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>Can I upload anything I want? 🎨</AccordionTrigger>
                  <AccordionContent>
                    Yes! Whether it's art, memes, personal photos, social media content, or business promotions - all posts are welcome as long as they follow our content guidelines 📋. Express yourself however you'd like! ✨
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                  <AccordionTrigger>Is NSFW content allowed? 🚫</AccordionTrigger>
                  <AccordionContent>
                    No, NSFW (Not Safe For Work) content is strictly prohibited 🚫. All uploads are public and should be appropriate for all audiences 👨‍👩‍👧‍👦. Any inappropriate content will be removed and may result in account restrictions ⚠️.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Footer - Compact */}
        <footer className="mt-4 pt-3 border-t border-border/50">
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p className="text-xs opacity-75">The experiment continues... Will you push the price higher? 🚀</p>
          </div>
        </footer>

        {/* Floating Upload CTA */}
        <FloatingUploadCTA onClick={scrollToUpload} />
      </div>
    </div>
  );
};

export default Index;
