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

    const confirmUpload = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('confirm-upload', {
          body: { session_id: sessionId },
        });

        if (error) throw error;

        if (data.success) {
          setIsSuccess(true);
          setUploadData(data.upload);
          toast({
            title: "Upload successful!",
            description: "Your picture has been uploaded and is now live in the gallery.",
          });
        } else {
          throw new Error('Upload confirmation failed');
        }
      } catch (error: any) {
        console.error('Upload confirmation error:', error);
        setError(error.message || 'Failed to confirm upload');
        toast({
          title: "Upload failed",
          description: error.message || "There was an error processing your upload.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    confirmUpload();
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
            <h2 className="text-xl font-semibold mb-2">Upload Failed</h2>
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
            Upload Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {uploadData && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={uploadData.image_url}
                  alt={uploadData.caption}
                  className="w-full h-48 sm:h-64 object-cover rounded-lg"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    #{uploadData.upload_order}
                  </Badge>
                  <Badge variant="outline" className="bg-background/80 text-xs">
                    £{(uploadData.price_paid / 100).toFixed(2)}
                  </Badge>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">{uploadData.caption}</h3>
                <p className="text-sm text-muted-foreground">
                  Your picture is now live in the gallery!
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Button onClick={() => navigate('/')} className="w-full glow-shadow">
              <Home className="w-4 h-4 mr-2" />
              Upload Another
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