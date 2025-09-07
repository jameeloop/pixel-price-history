import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Loader2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateEmail, validateCaption, validateFileUpload, sanitizeHtml } from '@/utils/inputValidation';
import CountUp from '@/components/CountUp';

interface UploadFormProps {
  currentPrice: number;
  onUploadSuccess: () => void;
}

interface ImageFile {
  name: string;
  type: string;
  data: string;
  file: File;
}

const UploadForm: React.FC<UploadFormProps> = ({ currentPrice, onUploadSuccess }) => {
  const [email, setEmail] = useState('');
  const [caption, setCaption] = useState('');
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [originalImage, setOriginalImage] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = useCallback((file: File) => {
    console.log('Processing file:', file.name, file.type, file.size);
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.isValid) {
      console.log('File validation failed:', fileValidation.error);
      toast({
        title: "Invalid file",
        description: fileValidation.error,
        variant: "destructive",
      });
      return;
    }

    console.log('File validation passed, reading file...');
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('File read successfully, data length:', result.length);
      setOriginalImage(result);
      setShowCropper(true);
      // Reset crop area for new image - will be centered when modal opens
      setCropArea({ x: 100, y: 100, width: 200, height: 200 });
      console.log('Image loaded, showing cropper');
    };
    reader.readAsDataURL(file);
  }, [toast]);

  // Center the crop area when cropper opens
  useEffect(() => {
    if (showCropper && originalImage) {
      // Use setTimeout to ensure image is rendered
      setTimeout(() => {
        const img = document.querySelector('.cropper-image') as HTMLImageElement;
        if (img) {
          const imgRect = img.getBoundingClientRect();
          const cropSize = Math.min(200, imgRect.width * 0.4, imgRect.height * 0.4);
          setCropArea({
            x: (imgRect.width - cropSize) / 2,
            y: (imgRect.height - cropSize) / 2,
            width: cropSize,
            height: cropSize,
          });
        }
      }, 100);
    }
  }, [showCropper, originalImage]);

  const cropImage = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Get the displayed image dimensions
      const displayedImg = document.querySelector('.cropper-image') as HTMLImageElement;
      if (!displayedImg) return;
      
      const displayedRect = displayedImg.getBoundingClientRect();
      
      // Calculate scale factors between original image and displayed image
      const scaleX = img.naturalWidth / displayedRect.width;
      const scaleY = img.naturalHeight / displayedRect.height;
      
      // Scale crop coordinates to match original image dimensions
      const scaledCropX = cropArea.x * scaleX;
      const scaledCropY = cropArea.y * scaleY;
      const scaledCropWidth = cropArea.width * scaleX;
      const scaledCropHeight = cropArea.height * scaleY;
      
      // Set canvas size to scaled crop area
      canvas.width = scaledCropWidth;
      canvas.height = scaledCropHeight;
      
      // Draw the cropped portion from the original image
      ctx?.drawImage(
        img,
        scaledCropX, scaledCropY, scaledCropWidth, scaledCropHeight, // Source rectangle (scaled)
        0, 0, scaledCropWidth, scaledCropHeight // Destination rectangle
      );
      
      // Convert to blob and create file
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
          const dataURL = canvas.toDataURL('image/jpeg', 0.9);
          
          setImageFile({
            name: 'cropped-image.jpg',
            type: 'image/jpeg',
            data: dataURL,
            file: croppedFile,
          });
          setImagePreview(dataURL);
          setShowCropper(false);
          setOriginalImage('');
          
          console.log('Crop applied:', {
            original: { width: img.naturalWidth, height: img.naturalHeight },
            displayed: { width: displayedRect.width, height: displayedRect.height },
            cropArea: cropArea,
            scaledCrop: { x: scaledCropX, y: scaledCropY, width: scaledCropWidth, height: scaledCropHeight }
          });
        }
      }, 'image/jpeg', 0.9);
    };
    
    img.src = originalImage;
  }, [originalImage, cropArea]);

  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - cropArea.x,
      y: e.clientY - rect.top - cropArea.y,
    });
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: cropArea.width,
      height: cropArea.height,
    });
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - rect.left - dragStart.x, rect.width - cropArea.width));
      const newY = Math.max(0, Math.min(e.clientY - rect.top - dragStart.y, rect.height - cropArea.height));
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      // Use the larger absolute delta to maintain square aspect ratio
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
      
      const newSize = Math.max(50, Math.min(resizeStart.width + delta, 
        Math.min(rect.width - cropArea.x, rect.height - cropArea.y)));
      
      setCropArea(prev => ({
        ...prev,
        width: newSize,
        height: newSize
      }));
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    setDragStart({
      x: touch.clientX - rect.left - cropArea.x,
      y: touch.clientY - rect.top - cropArea.y,
    });
  };

  const handleResizeTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    setIsResizing(true);
    setResizeStart({
      x: touch.clientX,
      y: touch.clientY,
      width: cropArea.width,
      height: cropArea.height,
    });
  };

  const handleImageTouchMove = (e: React.TouchEvent) => {
    if (!isDragging && !isResizing) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (isDragging) {
      const newX = Math.max(0, Math.min(touch.clientX - rect.left - dragStart.x, rect.width - cropArea.width));
      const newY = Math.max(0, Math.min(touch.clientY - rect.top - dragStart.y, rect.height - cropArea.height));
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      const deltaX = touch.clientX - resizeStart.x;
      const deltaY = touch.clientY - resizeStart.y;
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
      
      const newSize = Math.max(50, Math.min(resizeStart.width + delta, 
        Math.min(rect.width - cropArea.x, rect.height - cropArea.y)));
      
      setCropArea(prev => ({
        ...prev,
        width: newSize,
        height: newSize
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.log('File selected via input:', file.name, file.type, file.size);
    processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      console.log('File dropped:', files[0].name, files[0].type, files[0].size);
      processFile(files[0]);
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          processFile(file);
        }
        break;
      }
    }
  }, [processFile]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast({
        title: "Invalid email",
        description: emailValidation.error,
        variant: "destructive",
      });
      return;
    }
    
    // Validate caption
    const captionValidation = validateCaption(caption);
    if (!captionValidation.isValid) {
      toast({
        title: "Invalid caption",
        description: captionValidation.error,
        variant: "destructive",
      });
      return;
    }
    
    // Validate file
    if (!imageFile) {
      toast({
        title: "Missing image",
        description: "Please upload an image",
        variant: "destructive",
      });
      return;
    }
    
    const fileValidation = validateFileUpload(imageFile.file);
    if (!fileValidation.isValid) {
      toast({
        title: "Invalid file",
        description: fileValidation.error,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('=== FRONTEND: Calling create-payment function ===');
      console.log('Request data:', { 
        email: email.trim().toLowerCase(),
        caption: sanitizeHtml(caption.trim()),
        imageUrl: imageFile.data ? 'base64 data present' : 'NO DATA',
        fileName: imageFile.name
      });

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
          email: email.trim().toLowerCase(),
          caption: sanitizeHtml(caption.trim()),
          imageUrl: imageFile.data, // Send the base64 data URL
          fileName: imageFile.name
        },
      });

      console.log('=== FRONTEND: Function response ===');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('=== FRONTEND: Function returned error ===');
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      // Redirect to Stripe checkout
      if (data.url) {
        console.log('=== FRONTEND: Redirecting to Stripe ===');
        console.log('Stripe URL:', data.url);
        window.location.href = data.url;
      } else {
        console.error('=== FRONTEND: No URL in response ===');
        console.log('Full response data:', data);
        throw new Error('No checkout URL received');
      }
    } catch (error: unknown) {
      console.error('=== FRONTEND: Payment error caught ===');
      console.error('Payment error:', error);
      console.error('Error type:', typeof error);
      console.error('Error name:', (error as Error)?.name);
      console.error('Error message:', (error as Error)?.message);
      console.error('Error stack:', (error as Error)?.stack);
      toast({
        title: "Payment failed",
        description: (error as Error)?.message || "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs sm:text-sm font-semibold">
            Current Price: <CountUp 
              end={currentPrice / 100} 
              duration={1500}
              prefix="$"
              decimals={2}
              className="text-green-500 font-bold"
            />
          </Badge>
        </div>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="h-8 sm:h-9 text-sm"
            />
          </div>

          <div>
            <label htmlFor="caption" className="block text-sm font-medium mb-1.5">
              Caption
            </label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption for your picture..."
              rows={2}
              required
              className="resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Picture
            </label>
            <div className="space-y-3">
              <div
                onClick={() => {
                  console.log('Upload area clicked, triggering file input...');
                  fileInputRef.current?.click();
                }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary'
                }`}
              >
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full max-h-36 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-muted-foreground text-center">
                      Click to change image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <ImageIcon className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm sm:text-base font-medium">Click, drag & drop, or paste image</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        PNG, JPG, GIF supported
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
            className="w-full glow-shadow text-sm sm:text-base"
            disabled={isLoading || !email || !caption || !imageFile}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                <span className="text-sm sm:text-base">Creating Payment...</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Pay <CountUp 
                  end={currentPrice / 100} 
                  duration={1500}
                  prefix="$"
                  decimals={2}
                  className="text-green-500 font-bold"
                /> & Upload
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && originalImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-background rounded-lg p-3 sm:p-6 max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Crop Your Image</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCropper(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div 
                className="relative inline-block max-w-full mx-auto bg-gray-100 rounded-lg overflow-hidden"
                style={{ maxHeight: '50vh', minHeight: '200px' }}
                onMouseMove={handleImageMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchMove={handleImageTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={originalImage}
                  alt="Crop preview"
                  className="max-w-full max-h-full block cropper-image"
                  style={{ maxHeight: '60vh' }}
                />
                
                {/* Crop overlay */}
                <div
                  className="absolute border-2 border-primary bg-primary/20 cursor-move select-none touch-none"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                  }}
                  onMouseDown={handleCropMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  <div className="absolute inset-0 border border-white/50"></div>
                  
                  {/* Grid lines for rule of thirds */}
                  <div className="absolute inset-0">
                    <div className="absolute border-l border-white/30" style={{ left: '33.33%', height: '100%' }}></div>
                    <div className="absolute border-l border-white/30" style={{ left: '66.66%', height: '100%' }}></div>
                    <div className="absolute border-t border-white/30" style={{ top: '33.33%', width: '100%' }}></div>
                    <div className="absolute border-t border-white/30" style={{ top: '66.66%', width: '100%' }}></div>
                  </div>
                  
                  {/* Corner handles for dragging */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary border border-white rounded-full cursor-move"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary border border-white rounded-full cursor-move"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary border border-white rounded-full cursor-move"></div>
                  
                  {/* Resize handle (bottom-right corner) */}
                  <div 
                    className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-6 sm:h-6 cursor-se-resize flex items-center justify-center touch-none"
                    onMouseDown={handleResizeMouseDown}
                    onTouchStart={handleResizeTouchStart}
                    title="Drag to resize (maintains square ratio)"
                  >
                    <div className="w-4 h-4 sm:w-3 sm:h-3 bg-green-500 border border-white rounded-full hover:bg-green-400 transition-colors shadow-lg"></div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 sm:gap-3 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCropper(false)}
                  className="flex-1 sm:flex-none"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Cancel</span>
                </Button>
                <Button
                  onClick={cropImage}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
                >
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Apply Crop</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;