import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const CONTROL_PASSWORD_HASH = '8c2c9dcb6da0fa48a1c7b12f0e7b9b1d5c0e4a8f2b6d9e1c7a3f5b8e0d4c9a1b7'; // '1029384756Mn'
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