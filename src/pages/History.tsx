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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
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
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">PixPeriment Gallery</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                The experiment archive - watch prices climb with each upload
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto glass-card px-3 py-2">
            <Camera className="w-5 h-5 text-primary experiment-glow" />
            <span className="text-sm font-medium">Live Experiment</span>
          </div>
        </div>

        <Gallery />
      </div>
    </div>
  );
};

export default History;