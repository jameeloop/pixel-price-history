
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UploadForm from '@/components/UploadForm';
import Gallery from '@/components/Gallery';
import CurrentUploadHero from '@/components/CurrentUploadHero';
import EnhancedPricingDisplay from '@/components/EnhancedPricingDisplay';
import PsychologyFactsBox from '@/components/PsychologyFactsBox';
import ScrollIndicator from '@/components/ScrollIndicator';
import FloatingUploadCTA from '@/components/FloatingUploadCTA';

const Index = () => {
  const [currentPrice, setCurrentPrice] = useState(50);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "🎉 Upload Successful!",
      description: "Your image is now part of the experiment!",
    });
  };

  const handlePriceUpdate = (price: number) => {
    setCurrentPrice(price);
  };

  const scrollToUpload = () => {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <ScrollIndicator />
      <FloatingUploadCTA onClick={scrollToUpload} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
            PixPeriment
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The Social Experiment Where <span className="font-semibold text-primary">Every Upload Costs More</span> Than The Last
          </p>
        </div>

        {/* Current Upload Hero */}
        <CurrentUploadHero />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Upload Form */}
          <div className="lg:col-span-2 space-y-8">
            <div id="upload-section">
              <UploadForm 
                currentPrice={currentPrice} 
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
            
            {/* Gallery Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center gradient-text">
                Community Gallery
              </h2>
              <Gallery 
                refreshTrigger={refreshTrigger} 
                showSearch={true}
              />
            </div>
          </div>

          {/* Right Column - Experiment Status and Psychology Facts */}
          <div className="space-y-6">
            <EnhancedPricingDisplay onPriceUpdate={handlePriceUpdate} />
            <div className="hidden lg:block">
              <PsychologyFactsBox />
            </div>
          </div>
        </div>

        {/* Mobile Psychology Facts - shown below main content on smaller screens */}
        <div className="lg:hidden mb-8">
          <PsychologyFactsBox />
        </div>
      </div>
    </div>
  );
};

export default Index;
