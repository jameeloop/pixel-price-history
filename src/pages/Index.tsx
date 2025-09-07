import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, TrendingUp, Users, DollarSign, Clock, Heart, MessageCircle, Share2, ArrowRight, BarChart3, Zap, Target, Brain, Eye, Sparkles, Globe } from 'lucide-react';
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
    <div className="min-h-screen">
      {/* Header - Mobile optimized */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="https://i.imgur.com/8KY5V0m.png" 
                alt="PixPeriment Logo" 
                className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
              />
              <div>
                <h1 className="text-sm sm:text-lg font-bold gradient-text">The PixPeriment</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Social Experiment</p>
              </div>
            </div>
            
            {/* Desktop Info Bar - Centered */}
            <div className="hidden lg:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-4 text-xs text-purple-200 glass-card glow-outline p-2 bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-600/30">
                <span className="flex items-center gap-1">💰 Price increases</span>
                <span className="text-purple-400">•</span>
                <span className="flex items-center gap-1">🧠 Psychology test</span>
                <span className="text-purple-400">•</span>
                <span className="flex items-center gap-1">🎯 Scarcity experiment</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
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
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
              >
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Upload Now</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-2 sm:px-4 py-2">
        {/* Hero Section - Mobile optimized */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="mb-2 flex justify-center px-2">
            <div className="w-full max-w-4xl">
              <FuzzyText 
                baseIntensity={0.2} 
                hoverIntensity={0.5} 
                enableHover={true}
                fontSize="4rem"
                fontWeight={700}
                color="#8b5cf6"
              >
                The Social Experiment: How High Can It Go? 🚀
              </FuzzyText>
            </div>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 max-w-2xl mx-auto px-2 md:whitespace-nowrap">
            A psychological pricing experiment where each photo upload costs more than the last&nbsp;📈
          </p>
          {/* Mobile Info Bar */}
          <div className="lg:hidden glass-card glow-outline max-w-2xl mx-auto p-2 sm:p-3 bg-gradient-to-r from-purple-900/20 to-purple-800/20 border border-purple-600/30">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs text-purple-200">
              <span className="flex items-center gap-1">💰 Price increases</span>
              <span className="hidden sm:inline text-purple-400">•</span>
              <span className="flex items-center gap-1">🧠 Psychology test</span>
              <span className="hidden sm:inline text-purple-400">•</span>
              <span className="flex items-center gap-1">🎯 Scarcity experiment</span>
            </div>
          </div>
        </div>

        {/* Layout with Featured Upload left and Experiment Status right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 lg:mb-6">
          <div className="lg:col-span-2 lg:order-1">
            <div className="glow-outline">
              <CurrentUploadHero refreshTrigger={refreshGallery} />
            </div>
          </div>
          <div className="lg:order-2 space-y-2 sm:space-y-3 lg:space-y-4">
            <div className="glow-outline">
              <EnhancedPricingDisplay onPriceUpdate={() => {}} refreshTrigger={refreshGallery} />
            </div>
            {/* Psychology Facts Box - Only show on large screens below experiment status */}
            <div className="hidden lg:block glow-outline">
              <PsychologyFactsBox />
            </div>
          </div>
        </div>

        {/* Psychology Facts Box for mobile - separate from experiment status */}
        <div className="mb-2 sm:mb-3 lg:hidden glow-outline">
          <PsychologyFactsBox />
        </div>

        {/* Upload Section and Live Activity - Side by Side on Desktop */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {/* Join the Experiment - 65% width on desktop */}
            <div id="upload-section" className="lg:col-span-3">
              <Card className="glass-card border-primary/20 glow-outline">
                <CardHeader className="text-center pb-2 sm:pb-3 lg:pb-4 px-2 sm:px-3 lg:px-6">
                  <CardTitle className="text-sm sm:text-base lg:text-lg gradient-text flex items-center justify-center gap-2">
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                    Join the Experiment
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Upload your photo and become part of the pricing history
                  </p>
                </CardHeader>
                <CardContent className="pt-0 px-2 sm:px-3 lg:px-6">
                  <UploadForm currentPrice={nextPrice} onUploadSuccess={handleUploadSuccess} />
                </CardContent>
              </Card>
            </div>

            {/* Live Activity Feed and Prediction Poll - 25% width on desktop */}
            <div className="lg:col-span-1">
              {/* Mobile: Side by side layout */}
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-0 lg:space-y-3">
                <div>
                  <h2 className="text-sm sm:text-base lg:text-xl font-bold gradient-text flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3 lg:mb-4">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                    <span className="hidden sm:inline">Live Activity</span>
                    <span className="sm:hidden">Live</span>
                  </h2>
                  <div className="glow-outline">
                    <LiveFeed />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-sm sm:text-base lg:text-xl font-bold gradient-text flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3 lg:mb-4">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                    <span className="hidden sm:inline">Weekly Poll</span>
                    <span className="sm:hidden">Poll</span>
                  </h2>
                  <div className="glow-outline">
                    <PredictionPoll />
                  </div>
                </div>
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
            limitResults={6}
          />
        </div>


        {/* Psychology Facts Section */}

        {/* FAQ Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-6">
            <MessageCircle className="w-6 h-6" />
            Frequently Asked Questions
          </h2>
          <Card className="glass-card glow-outline">
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