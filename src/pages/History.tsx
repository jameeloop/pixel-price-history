import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Gallery from '@/components/Gallery';

const History: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/')}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Picture Gallery</h1>
              <p className="text-muted-foreground">
                All uploaded pictures in chronological order
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Live Gallery</span>
          </div>
        </div>

        <Gallery />
      </div>
    </div>
  );
};

export default History;