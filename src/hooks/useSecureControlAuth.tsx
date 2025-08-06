import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'secure_admin_session';

interface AdminSession {
  sessionToken: string;
  expiresAt: string;
}

export const useSecureControlAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session: AdminSession = JSON.parse(stored);
        
        // Check if session is expired
        if (new Date(session.expiresAt) <= new Date()) {
          localStorage.removeItem(SESSION_KEY);
          setIsAuthenticated(false);
          setSessionToken(null);
          setIsLoading(false);
          return;
        }

        // Verify session with server
        const { data, error } = await supabase.functions.invoke('admin-verify', {
          body: { sessionToken: session.sessionToken }
        });

        if (error || !data?.valid) {
          localStorage.removeItem(SESSION_KEY);
          setIsAuthenticated(false);
          setSessionToken(null);
        } else {
          setIsAuthenticated(true);
          setSessionToken(session.sessionToken);
        }
      }
    } catch (error) {
      console.error('Error checking auth session:', error);
      localStorage.removeItem(SESSION_KEY);
      setIsAuthenticated(false);
      setSessionToken(null);
    }
    setIsLoading(false);
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { password }
      });

      if (error || !data?.sessionToken) {
        toast.error('Invalid password 🚫');
        return false;
      }

      const session: AdminSession = {
        sessionToken: data.sessionToken,
        expiresAt: data.expiresAt
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setIsAuthenticated(true);
      setSessionToken(data.sessionToken);
      toast.success('Access granted! 🔓');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Authentication failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setSessionToken(null);
    toast.success('Logged out successfully 👋');
  };

  const deleteUpload = async (uploadId: string): Promise<boolean> => {
    if (!sessionToken) {
      toast.error('Not authenticated');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-upload', {
        body: { uploadId, sessionToken }
      });

      if (error || !data?.success) {
        toast.error('Failed to delete upload');
        return false;
      }

      toast.success('Upload deleted successfully');
      return true;
    } catch (error) {
      console.error('Delete upload error:', error);
      toast.error('Failed to delete upload');
      return false;
    }
  };

  const updatePricing = async (newPrice: number): Promise<boolean> => {
    if (!sessionToken) {
      toast.error('Not authenticated');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-update-pricing', {
        body: { newPrice, sessionToken }
      });

      if (error || !data?.success) {
        toast.error('Failed to update pricing');
        return false;
      }

      toast.success('Pricing updated successfully');
      return true;
    } catch (error) {
      console.error('Update pricing error:', error);
      toast.error('Failed to update pricing');
      return false;
    }
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    deleteUpload,
    updatePricing
  };
};