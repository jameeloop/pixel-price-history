import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

const FixImagesButton: React.FC = () => {
  const [isFixing, setIsFixing] = useState(false);

  const handleFixImages = async () => {
    setIsFixing(true);
    try {
      console.log('Calling fix-image-urls function...');
      
      const { data, error } = await supabase.functions.invoke('fix-image-urls');
      
      if (error) {
        console.error('Error calling fix function:', error);
        toast.error(`Failed to fix images: ${error.message}`);
        return;
      }

      console.log('Fix function response:', data);
      
      if (data.fixedCount > 0) {
        toast.success(`Fixed ${data.fixedCount} images!`);
      } else {
        toast.info('No broken images found to fix');
      }
      
      // Refresh the page to show updated images
      window.location.reload();
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Unexpected error occurred');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button 
      onClick={handleFixImages} 
      disabled={isFixing}
      variant="outline"
      className="mb-4"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isFixing ? 'animate-spin' : ''}`} />
      {isFixing ? 'Fixing Images...' : 'Fix Broken Images'}
    </Button>
  );
};

export default FixImagesButton;