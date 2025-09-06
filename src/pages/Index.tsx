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
import ScrollIndicator from '@/components/ScrollIndicator';
import AnimatedFAQ from '@/components/AnimatedFAQ';
import FuzzyText from '@/components/FuzzyText';
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
          <h2 className="text-2xl md:text-3xl font-bold mb-2 flex justify-center">
            <FuzzyText 
              baseIntensity={0.2} 
              hoverIntensity={0.5} 
              enableHover={true}
              fontSize="clamp(1.5rem, 6vw, 2.5rem)"
              fontWeight={700}
              color="#8b5cf6"
            >
              The Social Experiment: How High Can It Go? 🚀
            </FuzzyText>
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

        {/* Upload Section and Live Activity - Side by Side on Desktop */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Join the Experiment - 65% width on desktop */}
            <div id="upload-section" className="lg:col-span-3">
              <Card className="glass-card border-primary/20">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg gradient-text flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5" />
                    Join the Experiment
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload your photo and become part of the pricing history
                  </p>
            </CardHeader>
            <CardContent className="pt-0">
                  <UploadForm currentPrice={nextPrice} onUploadSuccess={handleUploadSuccess} />
            </CardContent>
          </Card>
        </div>

            {/* Live Activity Feed and Prediction Poll - 25% width on desktop */}
            <div className="lg:col-span-1 space-y-4">
              <div>
                <h2 className="text-xl font-bold gradient-text flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5" />
                  Live Activity
                </h2>
                <LiveFeed />
              </div>
              
              <div>
                <h2 className="text-xl font-bold gradient-text flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5" />
                  Weekly Poll
                </h2>
                <PredictionPoll />
              </div>
            </div>
          </div>
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
            limitResults={5}
          />
        </div>


        {/* Psychology Facts Section */}

        {/* FAQ Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-6">
            <MessageCircle className="w-6 h-6" />
            Frequently Asked Questions
          </h2>
          <Card className="glass-card">
            <CardContent className="p-6">
              <AnimatedFAQ />
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