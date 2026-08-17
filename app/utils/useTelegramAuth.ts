'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/app/utils/api';

export const useTelegramAuth = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setSession } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Get code from URL
  const code = searchParams.get('code');

  useEffect(() => {
    const handleAuth = async () => {
      // CASE 1: User already authenticated in state
      if (user) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // CASE 2: Check localStorage
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (setSession) {
            setSession(parsedUser, storedToken);
          }
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      // CASE 3: Exchange code from URL
      if (code) {
        try {
          console.log('🔑 Exchanging code:', code);
          const response = await api.post('/auth/exchange-game-code', { code });
          
          if (response.data.success) {
            const { token, user: userData } = response.data.data;
            
            // Set session directly using token and user
            if (setSession) {
              setSession(userData, token);
            }
            
            setIsAuthenticated(true);
            router.replace(window.location.pathname);
            setIsLoading(false);
            return;
          } else {
            console.error('❌ Code exchange failed:', response.data.message);
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
        } catch (error: any) {
          console.error('❌ Error exchanging code:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      }

      // CASE 4: No auth found
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    handleAuth();
  }, [code, router, user, setSession]);

  return { isLoading, isAuthenticated, user };
};