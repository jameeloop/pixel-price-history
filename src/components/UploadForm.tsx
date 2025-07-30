import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadFormProps {
  currentPrice: number;
  onUploadSuccess: () => void;
}

interface ImageFile {
  name: string;
  type: string;
  data: string;
}

const UploadForm: React.FC<UploadFormProps> = ({ currentPrice, onUploadSuccess }) => {
  const [email, setEmail] = useState('');
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageFile({
        name: file.name,
        type: file.type,
        data: result,
      });
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !caption || !imageFile) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select an image",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { email, caption, imageFile },
      });

      if (error) throw error;

      // Open Stripe checkout in new tab
      if (data.url) {
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment page opened",
          description: "Complete your payment to upload your picture",
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: error.message || "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-2xl font-bold gradient-text">
          Upload Your Picture
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg font-semibold">
            Current Price: {formatPrice(currentPrice)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="caption" className="block text-sm font-medium mb-2">
              Caption
            </label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption for your picture..."
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Picture
            </label>
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-48 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground">
                      Click to change image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">Click to upload image</p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full glow-shadow"
            disabled={isLoading || !email || !caption || !imageFile}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Payment...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Pay {formatPrice(currentPrice)} & Upload
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadForm;