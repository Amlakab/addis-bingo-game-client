// hooks/useTelegramAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/app/utils/api';

export const useTelegramAuth = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth(); // Just get user from auth context
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const code = searchParams.get('code');

  useEffect(() => {
    const handleAuth = async () => {
      // CASE 1: User already authenticated (from auth context)
      if (user) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // CASE 2: Check if token exists in localStorage (already logged in)
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // CASE 3: User coming from bot with one-time code
      if (code) {
        try {
          const response = await api.post('/auth/exchange-game-code', { code });
          
          if (response.data.success) {
            const { token, user: userData } = response.data.data;
            
            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            setIsAuthenticated(true);
            // Remove code from URL
            router.replace(window.location.pathname);
            setIsLoading(false);
            return;
          } else {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error exchanging code:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      }

      // CASE 4: No auth at all - redirect to login
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    handleAuth();
  }, [code, router, user]);

  return { isLoading, isAuthenticated, user };
};