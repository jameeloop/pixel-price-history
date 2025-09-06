import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, TrendingUp, Users, DollarSign, Clock, Heart, MessageCircle, Share2, ArrowRight, BarChart3, Zap, Target, Brain, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import CurrentUploadHero from '@/components/CurrentUploadHero';
import EnhancedPricingDisplay from '@/components/EnhancedPricingDisplay';
import UploadForm from '@/components/UploadForm';
import Gallery from '@/components/Gallery';
import LiveFeed from '@/components/LiveFeed';
import PredictionPoll from '@/components/PredictionPoll';
import PsychologyFactsBox from '@/components/PsychologyFactsBox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ScrollIndicator from '@/components/ScrollIndicator';
import { usePricing } from '@/hooks/usePricing';

const Index = () => {
  const navigate = useNavigate();
  const { nextPrice } = usePricing();
  const [refreshGallery, setRefreshGallery] = useState(0);

  console.log('Index component rendering, nextPrice:', nextPrice);

  const handleUploadSuccess = () => {
    setRefreshGallery(prev => prev + 1);
  };

  const scrollToUpload = () => {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
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
              <div className="hidden md:flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/history')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  History
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/control')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Target className="w-4 h-4 mr-1" />
                  Control
                </Button>
              </div>
              <Button 
                onClick={scrollToUpload}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-2">
        {/* Hero Section - Much more compact */}
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            <span className="gradient-text experiment-glow">The Social Experiment: How High Can It Go? 🚀</span>
          </h2>
          <p className="text-sm text-muted-foreground mb-3 max-w-xl mx-auto">
            A psychological pricing experiment where each photo upload costs more than the last 📈
          </p>
          <div className="glass-card max-w-2xl mx-auto p-2 bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-600/30">
            <div className="flex flex-wrap justify-center gap-4 text-xs text-purple-200">
              <span className="flex items-center gap-1">💰 Price increases with each upload</span>
              <span className="hidden sm:inline text-purple-400">•</span>
              <span className="flex items-center gap-1">🧠 Testing social psychology</span>
              <span className="hidden sm:inline text-purple-400">•</span>
              <span className="flex items-center gap-1">🎯 Digital scarcity experiment</span>
            </div>
          </div>
        </div>

        {/* Layout with Featured Upload left and Experiment Status right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2 lg:order-1">
            <CurrentUploadHero refreshTrigger={refreshGallery} />
          </div>
          <div className="lg:order-2 space-y-4">
            <EnhancedPricingDisplay onPriceUpdate={() => {}} refreshTrigger={refreshGallery} />
            {/* Psychology Facts Box - Only show on large screens below experiment status */}
            <div className="hidden lg:block">
              <PsychologyFactsBox />
            </div>
          </div>
        </div>

        {/* Psychology Facts Box for mobile - separate from experiment status */}
        <div className="mb-4 lg:hidden">
          <PsychologyFactsBox />
        </div>

        {/* Upload Section */}
        <div id="upload-section" className="mb-8">
          <Card className="glass-card border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl gradient-text flex items-center justify-center gap-2">
                <Upload className="w-6 h-6" />
                Join the Experiment
              </CardTitle>
              <p className="text-muted-foreground">
                Upload your photo and become part of the pricing history
              </p>
            </CardHeader>
            <CardContent>
              <UploadForm currentPrice={nextPrice} onUploadSuccess={handleUploadSuccess} />
            </CardContent>
          </Card>
        </div>

        {/* Gallery Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text flex items-center gap-2">
              <Eye className="w-6 h-6" />
              Recent Uploads
            </h2>
            <Button 
              variant="outline" 
              onClick={() => navigate('/history')}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <Gallery 
            refreshTrigger={refreshGallery}
            limitResults={6}
          />
        </div>

        {/* Live Feed Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6" />
            Live Activity
          </h2>
          <LiveFeed />
        </div>

        {/* Prediction Poll Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-6">
            <Target className="w-6 h-6" />
            Predict the Next Price
          </h2>
          <PredictionPoll />
        </div>

        {/* Psychology Facts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-6">
            <Brain className="w-6 h-6" />
            The Psychology Behind It
          </h2>
          <PsychologyFactsBox />
        </div>

        {/* FAQ Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-6">
            <MessageCircle className="w-6 h-6" />
            Frequently Asked Questions
          </h2>
          <Card className="glass-card">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    How does the pricing work?
                  </AccordionTrigger>
                  <AccordionContent>
                    Each upload costs more than the previous one. The price increases by a fixed amount with every upload, creating a sense of scarcity and urgency.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    What happens to my photos?
                  </AccordionTrigger>
                  <AccordionContent>
                    Your photos are stored securely and displayed in the gallery. You can view them anytime and see how they contribute to the experiment's pricing history.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    Can I delete my uploads?
                  </AccordionTrigger>
                  <AccordionContent>
                    Currently, uploads cannot be deleted to maintain the integrity of the pricing experiment. This ensures the pricing history remains accurate.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    Is this a real experiment?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes! This is a real psychological experiment studying how people respond to increasing prices and scarcity. Your participation helps researchers understand human behavior.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Scroll Indicator */}
        <ScrollIndicator />
      </div>
    </div>
  );
};

export default Index;