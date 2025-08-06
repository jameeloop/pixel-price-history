import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const CONTROL_PASSWORD_HASH = '2212fe46729ca6d25f28cad6fe0f3a11f12642c4b4c255cd285d1b5a1ae7a413'; // '1029384756Mn'
const SESSION_KEY = 'control_panel_auth';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

interface AuthSession {
  authenticated: boolean;
  timestamp: number;
}

export const useControlAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthSession();
  }, []);

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const checkAuthSession = () => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);
        const isValid = session.authenticated && 
                       (Date.now() - session.timestamp) < SESSION_DURATION;
        
        if (isValid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('Error checking auth session:', error);
      localStorage.removeItem(SESSION_KEY);
    }
    setIsLoading(false);
  };

  const login = async (password: string): Promise<boolean> => {
    try {
      const hashedInput = await hashPassword(password);
      
      // Debug logging to see what hash is generated
      console.log('Password entered:', password);
      console.log('Generated hash:', hashedInput);
      console.log('Expected hash:', CONTROL_PASSWORD_HASH);
      
      if (hashedInput === CONTROL_PASSWORD_HASH) {
        const session: AuthSession = {
          authenticated: true,
          timestamp: Date.now()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setIsAuthenticated(true);
        toast.success('Access granted! 🔓');
        return true;
      } else {
        toast.error('Invalid password 🚫');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Authentication failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    toast.success('Logged out successfully 👋');
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  };
};