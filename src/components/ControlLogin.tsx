import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Shield, AlertTriangle } from 'lucide-react';

interface ControlLoginProps {
  onLogin: (password: string) => Promise<boolean>;
}

const ControlLogin: React.FC<ControlLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    const success = await onLogin(password);
    setIsLoading(false);
    
    if (!success) {
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center experiment-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl gradient-text">Control Panel Access 🔐</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the admin password to access control features
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!password.trim() || isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Access Control Panel 🚀'}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
};

export default ControlLogin;