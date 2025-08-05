import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Upload, 
  Users, 
  TrendingUp, 
  Settings, 
  Database,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Upload {
  id: string;
  user_email: string;
  image_url: string;
  caption: string;
  price_paid: number;
  upload_order: number;
  created_at: string;
}

interface PricingData {
  id: string;
  current_price: number;
  upload_count: number;
  updated_at: string;
}

const ControlPanel: React.FC = () => {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch uploads
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (uploadsError) {
        console.error('Error fetching uploads:', uploadsError);
        toast.error('Failed to fetch uploads');
      } else {
        setUploads(uploadsData || []);
      }

      // Fetch pricing
      const { data: pricingData, error: pricingError } = await supabase
        .from('pricing')
        .select('*')
        .single();

      if (pricingError) {
        console.error('Error fetching pricing:', pricingError);
        toast.error('Failed to fetch pricing data');
      } else {
        setPricing(pricingData);
        setNewPrice((pricingData.current_price / 100).toString());
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrice = async () => {
    if (!newPrice || isNaN(Number(newPrice))) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      const priceInCents = Math.round(Number(newPrice) * 100);
      
      // Note: This will fail due to RLS policies, but shows the intended functionality
      const { error } = await supabase
        .from('pricing')
        .update({ current_price: priceInCents })
        .eq('id', pricing?.id);

      if (error) {
        console.error('Error updating price:', error);
        toast.error('Failed to update price - Admin privileges required');
      } else {
        toast.success('Price updated successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update price');
    }
  };

  const deleteUpload = async (uploadId: string) => {
    if (!confirm('Are you sure you want to delete this upload?')) return;

    try {
      // Note: This will fail due to RLS policies, but shows the intended functionality
      const { error } = await supabase
        .from('uploads')
        .delete()
        .eq('id', uploadId);

      if (error) {
        console.error('Error deleting upload:', error);
        toast.error('Failed to delete upload - Admin privileges required');
      } else {
        toast.success('Upload deleted successfully');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete upload');
    }
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalRevenue = uploads.reduce((sum, upload) => sum + upload.price_paid, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Control Panel</h1>
        <p className="text-muted-foreground">Manage your PixPeriment application</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">{formatPrice(totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Uploads</p>
                <p className="text-2xl font-bold text-primary">{uploads.length}</p>
              </div>
              <Upload className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold text-primary">
                  {pricing ? formatPrice(pricing.current_price) : 'Loading...'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Price</p>
                <p className="text-2xl font-bold text-primary">
                  {uploads.length > 0 ? formatPrice(totalRevenue / uploads.length) : '$0.00'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="uploads" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="uploads">Uploads Management</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Control</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="uploads">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Uploads Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploads.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No uploads found</p>
                ) : (
                  uploads.map((upload) => (
                    <div key={upload.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                      <img
                        src={upload.image_url}
                        alt={upload.caption}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{upload.caption}</p>
                        <p className="text-sm text-muted-foreground">{upload.user_email}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <Badge variant="outline">#{upload.upload_order}</Badge>
                          <span className="text-sm text-primary font-medium">
                            {formatPrice(upload.price_paid)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(upload.created_at)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteUpload(upload.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Pricing Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="price">Current Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Enter new price"
                    />
                  </div>
                  <Button onClick={updatePrice} className="w-full">
                    Update Price
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium mb-2">Current Settings</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-medium">
                          {pricing ? formatPrice(pricing.current_price) : 'Loading...'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Upload Count:</span>
                        <span className="font-medium">{pricing?.upload_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Updated:</span>
                        <span className="font-medium">
                          {pricing ? formatDate(pricing.updated_at) : 'Loading...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Data Management</h3>
                  <Button
                    variant="outline"
                    onClick={fetchData}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Security Notice</h3>
                  <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
                    <p className="text-sm text-yellow-200">
                      ⚠️ Most admin functions require elevated privileges. 
                      Current implementation shows interface but requires proper authentication.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ControlPanel;