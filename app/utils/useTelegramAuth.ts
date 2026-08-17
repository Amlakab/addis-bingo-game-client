'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/app/utils/api';

export interface AuthPopupState {
  show: boolean;
  type: 'info' | 'success' | 'error';
  message: string;
}

export const useTelegramAuth = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setSession } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [popup, setPopup] = useState<AuthPopupState>({
    show: false,
    type: 'info',
    message: ''
  });

  const isExchangingRef = useRef(false);

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, show: false }));
  };

  // Helper function to clear old session
  const clearOldSession = () => {
    console.log('🧹 [Auth] Clearing old session data...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  useEffect(() => {
    const handleAuth = async () => {
      // CASE 1: User already authenticated in state
      if (user) {
        console.log('✅ [Auth] User session active in React Context:', user);
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
          console.log('📦 [Auth] Restoring user session from localStorage:', parsedUser);
          
          if (setSession) {
            setSession(parsedUser, storedToken);
          }
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('❌ [Auth] Failed to parse stored user, clearing storage.', e);
          clearOldSession();
        }
      }

      // CASE 3: Exchange code from Telegram Bot URL
      const code = searchParams.get('code');

      if (code && !isExchangingRef.current) {
        isExchangingRef.current = true;
        
        console.log('🤖 [Telegram Auth] One-time code detected from Telegram Bot URL:', code);
        
        setPopup({
          show: true,
          type: 'info',
          message: 'Validating single-use Telegram access code...'
        });

        try {
          console.log('🔄 [Telegram Auth] Sending code to server (/auth/exchange-game-code)...');
          
          const response = await api.post('/auth/exchange-game-code', { code });

          if (response.data && response.data.success) {
            const { token, user: userData } = response.data.data;

            console.log('🎉 [Telegram Auth] Code validated successfully! User:', userData);

            // ✅ CLEAR OLD SESSION FIRST
            clearOldSession();
            
            // Then set new session
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            if (setSession) {
              setSession(userData, token);
            }

            setIsAuthenticated(true);
            setIsLoading(false);

            setPopup({
              show: true,
              type: 'success',
              message: 'Authentication successful! Welcome to the game.'
            });

            // Remove code query parameter from URL without reloading
            router.replace(window.location.pathname);
            return;
          } else {
            const errMsg = response.data?.message || 'Code exchange failed on backend.';
            console.warn('⚠️ [Telegram Auth] Code exchange rejected:', errMsg);

            // Clear any stale data on failure
            clearOldSession();

            setPopup({
              show: true,
              type: 'error',
              message: `Telegram Login Failed: ${errMsg}`
            });

            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
        } catch (error: any) {
          const serverError = error.response?.data?.message || error.message || 'Network error.';
          console.error('❌ [Telegram Auth] Exception during code exchange:', serverError);

          // Clear any stale data on error
          clearOldSession();

          setPopup({
            show: true,
            type: 'error',
            message: `Authentication Error: ${serverError}`
          });

          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      }

      // CASE 4: No auth parameters present
      if (!code) {
        console.log('ℹ️ [Auth] No active session or Telegram code found.');
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    handleAuth();
  }, [searchParams, router, user, setSession]);

  return { isLoading, isAuthenticated, user, popup, closePopup };
};