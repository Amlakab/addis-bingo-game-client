// hooks/useTelegramAuth.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/app/utils/api';

export const useTelegramAuth = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check for code in URL (fallback for direct links)
  const urlCode = searchParams.get('code');

  useEffect(() => {
    const handleAuth = async () => {
      console.log('🔍 useTelegramAuth: Starting auth check...');
      
      // CASE 1: User already authenticated (from auth context)
      if (user) {
        console.log('✅ User already authenticated from context');
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // CASE 2: Check if token exists in localStorage (already logged in)
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        console.log('✅ User already authenticated from localStorage');
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // CASE 3: Get code from Telegram WebApp start_param (SECURE WAY)
      let authCode = urlCode;
      
      // Check if running in Telegram WebApp
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const webapp = (window as any).Telegram.WebApp;
        const startParam = webapp.initDataUnsafe?.start_param;
        if (startParam) {
          authCode = startParam;
          console.log('🔑 Code from WebApp start_param:', authCode);
        }
      }
      
      // CASE 4: Exchange code for token
      if (authCode) {
        try {
          console.log('🔑 Exchanging code:', authCode);
          const response = await api.post('/auth/exchange-game-code', { code: authCode });
          
          if (response.data.success) {
            const { token, user: userData } = response.data.data;
            
            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Update auth context if login function exists
            // if (login) {
            //   login(userData);
            // }
            
            setIsAuthenticated(true);
            
            // Remove code from URL if it was from URL
            if (urlCode) {
              router.replace(window.location.pathname);
            }
            
            console.log('✅ Authentication successful!');
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
          console.error('❌ Error details:', error.response?.data || error.message);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      }

      // CASE 5: No auth at all - redirect to login
      console.log('❌ No authentication found, redirecting to login');
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    handleAuth();
  }, [urlCode, router, user, login]);

  return { isLoading, isAuthenticated, user };
};