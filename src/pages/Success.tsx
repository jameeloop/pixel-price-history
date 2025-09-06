import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle, Home, History, ImageIcon, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadData, setUploadData] = useState<{
    id: string;
    user_email: string;
    image_url: string;
    caption: string;
    price_paid: number;
    upload_order: number;
    created_at: string;
  } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setIsProcessing(false);
      return;
    }

    const processPaymentAndFetchUpload = async () => {
      try {
        console.log('Processing payment for session:', sessionId);
        
        // First, check if upload already exists using get-uploads endpoint
        const { data: uploadsData, error: uploadsError } = await supabase.functions.invoke('get-uploads', {
          body: {}
        });
        
        if (uploadsError) {
          console.error('Error fetching uploads:', uploadsError);
        } else {
          const uploads = uploadsData.uploads || [];
          const existingUpload = uploads.find((upload: { stripe_session_id?: string }) => upload.stripe_session_id === sessionId);
          
          if (existingUpload) {
            console.log('Upload already exists:', existingUpload);
            setUploadData(existingUpload);
            // Generate QR code for the post URL
            const postUrl = `${window.location.origin}/post/${existingUpload.id}`;
            const qrCode = await QRCode.toDataURL(postUrl);
            setQrCodeUrl(qrCode);
            // Set flag to refresh gallery when user returns to main page
            localStorage.setItem('refreshGallery', 'true');
            return;
          }
        }

        // If upload doesn't exist, try to process the payment
        console.log('No existing upload found, processing payment...');
        const { data: processResult, error: processError } = await supabase.functions.invoke('process-payment', {
          body: { session_id: sessionId }
        });

        if (processError) {
          console.error('Error processing payment:', processError);
          console.error('Process error details:', JSON.stringify(processError, null, 2));
          setError(`Failed to process payment: ${processError.message || 'Unknown error'}`);
          return;
        }

        console.log('Payment processed successfully:', processResult);

        // Handle different response types from process-payment
        if (processResult.upload) {
          // New upload was created
          console.log('Upload data received:', processResult.upload);
          setUploadData(processResult.upload);
          // Generate QR code for the post URL
          const postUrl = `${window.location.origin}/post/${processResult.upload.id}`;
          const qrCode = await QRCode.toDataURL(postUrl);
          setQrCodeUrl(qrCode);
          // Set flag to refresh gallery when user returns to main page
          localStorage.setItem('refreshGallery', 'true');
        } else if (processResult.upload_id) {
          // Upload already exists, fetch the upload data
          console.log('Upload already processed, fetching data for ID:', processResult.upload_id);
          const { data: uploadsData, error: fetchError } = await supabase.functions.invoke('get-uploads', {
            body: {}
          });
          
          if (fetchError) {
            console.error('Error fetching existing upload:', fetchError);
            setError('Failed to fetch upload data. Please contact support if this persists.');
            return;
          }
          
          const uploads = uploadsData.uploads || [];
          const existingUpload = uploads.find((upload: { id: string }) => upload.id === processResult.upload_id);
          
          if (existingUpload) {
            console.log('Found existing upload:', existingUpload);
            setUploadData(existingUpload);
            // Generate QR code for the post URL
            const postUrl = `${window.location.origin}/post/${existingUpload.id}`;
            const qrCode = await QRCode.toDataURL(postUrl);
            setQrCodeUrl(qrCode);
            // Set flag to refresh gallery when user returns to main page
            localStorage.setItem('refreshGallery', 'true');
          } else {
            console.error('Could not find existing upload with ID:', processResult.upload_id);
            setError('Upload not found. Please contact support if this persists.');
          }
        } else {
          console.error('No upload data returned from process-payment:', processResult);
          setError('Upload not found. Please contact support if this persists.');
        }
      } catch (error) {
        console.error('Error processing payment or fetching upload data:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        setError(`Failed to process payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    setTimeout(async () => {
      await processPaymentAndFetchUpload();
      setIsProcessing(false);
      setIsSuccess(true);
      toast.success("You're part of the experiment! Payment successful.");
    }, 2000);
  }, [sessionId]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full experiment-glow">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="text-xl font-semibold mb-2">Processing your contribution...</h2>
            <p className="text-muted-foreground">
              Adding your upload to the experiment. The price is climbing!
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
            <Button onClick={() => navigate('/')} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Experiment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="glass-card max-w-lg w-full experiment-glow">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 experiment-glow" />
          <CardTitle className="text-xl sm:text-2xl font-bold gradient-text">
            You're Part of the Experiment!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            {uploadData && (
              <div className="glass-card p-4 space-y-3">
                <img
                  src={uploadData.image_url}
                  alt={uploadData.caption}
                  className="w-full max-w-sm mx-auto rounded-lg"
                />
                <div>
                  <h3 className="font-semibold">"{uploadData.caption}"</h3>
                  <p className="text-sm text-muted-foreground">
                    Price paid: ${(uploadData.price_paid / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
            
            {uploadData && qrCodeUrl && (
              <div className="glass-card p-4 space-y-3">
                <h3 className="font-semibold">Share Your Post</h3>
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-32 h-32 mx-auto"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const postUrl = `${window.location.origin}/post/${uploadData.id}`;
                    const shareText = `Check out my post on PixPeriment! ${postUrl}`;
                    navigator.clipboard.writeText(shareText);
                    setCopied(true);
                    toast.success('Link copied to clipboard!');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Copy Share Link
                    </>
                  )}
                </Button>
              </div>
            )}
            
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🧠 <strong>Experiment continues!</strong> The next person will pay 1¢ more.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button onClick={() => navigate('/')} className="w-full experiment-glow">
              <Home className="w-4 h-4 mr-2" />
              Watch the Experiment Continue
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