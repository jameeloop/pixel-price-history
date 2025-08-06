import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  caption: string;
  uploadOrder: number;
  pricePaid: number;
  uploadDate: string;
  userEmail: string;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
  uploadOrder,
  pricePaid,
  uploadDate,
  userEmail
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 1));
    if (zoom <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const formatEmail = (email: string) => {
    const [username] = email.split('@');
    return username.length <= 3 ? 'Anonymous User' : `${username.substring(0, 2)}***`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `pixperiment-${uploadOrder}.jpg`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-semibold">
              #{uploadOrder}
            </Badge>
            <Badge variant="outline" className="bg-background/90">
              {formatPrice(pricePaid)}
            </Badge>
            <span className="text-white/80 text-sm">{formatDate(uploadDate)}</span>
            <span className="text-white/60 text-sm">by {formatEmail(userEmail)}</span>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white hover:bg-white/20"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download Image</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Container */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-4 pt-20 pb-20"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="relative max-w-full max-h-full overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            src={imageUrl}
            alt={caption}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              imageRendering: zoom > 1 ? 'crisp-edges' : 'auto'
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-white text-sm leading-relaxed">{caption}</p>
        </div>
      </div>
    </div>
  );
};

export default ImageLightbox;