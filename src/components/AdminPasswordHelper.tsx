import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { generatePasswordHash } from '@/utils/generatePasswordHash';

const AdminPasswordHelper: React.FC = () => {
  const [password, setPassword] = useState('');
  const [hash, setHash] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generatePasswordHash(password);
      setHash(generated);
      toast.success('Hash generated successfully!');
    } catch (error) {
      toast.error('Error generating hash');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyHash = () => {
    if (hash) {
      navigator.clipboard.writeText(hash);
      toast.success('Hash copied to clipboard!');
    }
  };

  return (
    <Card className="glass-card max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg gradient-text">Admin Password Hash Generator</CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate SHA-256 hash for admin password
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password to hash"
          />
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !password.trim()}
          className="w-full"
        >
          {isGenerating ? 'Generating...' : 'Generate Hash'}
        </Button>

        {hash && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Generated Hash</label>
            <div className="flex gap-2">
              <Input
                value={hash}
                readOnly
                className="font-mono text-xs"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyHash}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Copy this hash to your ADMIN_PASSWORD_HASH environment variable
            </p>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground mb-2">Common passwords:</p>
          <div className="space-y-1 text-xs">
            <div>admin: 8c6976e5b...a918</div>
            <div>control: baf1ff66b...5c2b</div>
            <div>password: 5e884898d...42d8</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPasswordHelper;