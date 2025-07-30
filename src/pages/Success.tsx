import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, AlertCircle, Home, History, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadData, setUploadData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setIsProcessing(false);
      return;
    }

    // Since we're using webhooks, we don't need to confirm upload here
    // Just show success and let the webhook handle the processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast({
        title: "Payment successful!",
        description: "Your upload is being processed. You'll receive an email confirmation shortly.",
      });
    }, 2000);
  }, [sessionId, toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold mb-2">Processing your upload...</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment and upload your picture.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/')} className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="glass-card max-w-lg w-full glow-shadow">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold gradient-text">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <div className="bg-muted/50 p-4 rounded-lg">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Your upload is being processed</h3>
              <p className="text-sm text-muted-foreground mt-2">
                You'll receive an email confirmation with your upload details shortly. 
                Your picture will appear in the gallery once processing is complete.
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Next upload price increased!</strong> The next person will pay 1p more.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button onClick={() => navigate('/')} className="w-full glow-shadow">
              <Home className="w-4 h-4 mr-2" />
              Upload Another Picture
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/history')} 
              className="w-full"
            >
              <History className="w-4 h-4 mr-2" />
              View Gallery
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Success;