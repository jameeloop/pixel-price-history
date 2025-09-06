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
  Activity,
  LogOut,
  RotateCcw,
  ArrowLeft,
  Download,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSecureControlAuth } from '@/hooks/useSecureControlAuth';
import ControlLogin from '@/components/ControlLogin';
import MaskedEmail from '@/components/MaskedEmail';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, login, logout, deleteUpload: secureDeleteUpload, updatePricing: secureUpdatePricing } = useSecureControlAuth();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Use the get-uploads function to fetch uploads (bypasses RLS)
      const { data: uploadsResponse, error: uploadsError } = await supabase.functions.invoke('get-uploads', {
        body: { limit: 1000 }
      });

      if (uploadsError) {
        console.error('Error fetching uploads:', uploadsError);
        toast.error('Failed to fetch uploads');
      } else {
        const uploadsData = uploadsResponse?.uploads || [];
        setUploads(uploadsData);
        
        // Calculate price directly from upload count
        const uploadCount = uploadsData.length;
        const currentPrice = 100 + uploadCount; // $1.00 + upload count
        const pricingData = { 
          id: 'system', 
          current_price: currentPrice, 
          upload_count: uploadCount,
          updated_at: new Date().toISOString()
        };
        setPricing(pricingData);
        setNewPrice((currentPrice / 100).toString());
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

    const priceInCents = Math.round(Number(newPrice) * 100);
    const success = await secureUpdatePricing(priceInCents);
    if (success) {
      setPricing(prev => prev ? { ...prev, current_price: priceInCents } : null);
      await fetchData(); // Refresh data
    }
  };

  const deleteUpload = async (uploadId: string) => {
    if (!confirm('Are you sure you want to delete this upload?')) return;
    
    const success = await secureDeleteUpload(uploadId);
    if (success) {
      setUploads(uploads.filter(upload => upload.id !== uploadId));
    }
  };

  const resetPricing = async () => {
    if (!confirm('⚠️ Reset pricing to $1.00 and upload count to 0? This cannot be undone!')) return;

    const success = await secureUpdatePricing(100); // $1.00 in cents
    if (success) {
      setPricing(prev => prev ? { ...prev, current_price: 100, upload_count: 0 } : null);
      setNewPrice('1.00');
      await fetchData(); // Refresh data
    }
  };

  const exportData = () => {
    const data = {
      uploads: uploads,
      pricing: pricing,
      exportDate: new Date().toISOString(),
      totalRevenue: totalRevenue
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixperiment-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully! 📊');
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

  // Authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ControlLogin onLogin={login} />;
  }

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Control Panel 🎛️</h1>
            <p className="text-sm text-muted-foreground">Manage your PixPeriment application</p>
          </div>
          <Button variant="outline" onClick={logout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="uploads">Uploads Management</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Control</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Export</TabsTrigger>
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
                        <p className="text-sm text-muted-foreground">
                          <MaskedEmail email={upload.user_email} />
                        </p>
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
                    <Settings className="w-4 h-4 mr-2" />
                    Update Price
                  </Button>
                  <Button 
                    onClick={resetPricing} 
                    variant="destructive" 
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Pricing
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg">
                    <h3 className="font-medium mb-2">Current Settings 📊</h3>
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

        <TabsContent value="analytics">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Analytics & Data Export 📊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Revenue Analytics 💰</h3>
                  <div className="space-y-3">
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Revenue</span>
                        <span className="text-xl font-bold text-primary">
                          {formatPrice(totalRevenue)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Average Upload Price</span>
                        <span className="text-lg font-semibold">
                          {uploads.length > 0 ? formatPrice(totalRevenue / uploads.length) : '$0.00'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Price Growth</span>
                        <span className="text-lg font-semibold text-green-500">
                          {uploads.length > 1 ? `+${uploads.length - 1}¢` : '0¢'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Data Export 📁</h3>
                  <div className="space-y-3">
                    <Button onClick={exportData} className="w-full gap-2">
                      <Download className="w-4 h-4" />
                      Export All Data (JSON)
                    </Button>
                    <div className="p-4 border border-green-500/20 bg-green-500/10 rounded-lg">
                      <h4 className="font-medium text-green-200 mb-2">Export Includes:</h4>
                      <ul className="text-sm text-green-200 space-y-1">
                        <li>• All upload data and metadata</li>
                        <li>• Current pricing information</li>
                        <li>• Revenue analytics</li>
                        <li>• Export timestamp</li>
                      </ul>
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
                System Settings ⚙️
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Data Management 🔄</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={fetchData}
                      className="w-full gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Data
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={resetPricing}
                      className="w-full gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Pricing System
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Security Notice 🔐</h3>
                  <div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-200">
                        <p className="font-medium mb-1">⚠️ Admin Access Active</p>
                        <p>Most admin functions require elevated privileges. Current implementation shows interface but requires proper authentication for database modifications.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border border-blue-500/20 bg-blue-500/10 rounded-lg">
                    <div className="text-sm text-blue-200">
                      <p className="font-medium mb-1">🔒 Session Info</p>
                      <p>Your session will expire after 30 minutes of inactivity for security.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ControlPanel;