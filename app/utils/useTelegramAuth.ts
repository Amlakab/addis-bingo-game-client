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

  // Prevent the same one-time code from being exchanged multiple times
  const isExchangingRef = useRef(false);

  /**
   * Close authentication popup
   */
  const closePopup = () => {
    setPopup((prev) => ({
      ...prev,
      show: false
    }));
  };

  /**
   * Clear old authentication session
   *
   * This is important because Telegram WebView can keep
   * localStorage/sessionStorage from a previous user.
   */
  const clearOldSession = () => {
    console.log('🧹 [Auth] Clearing old session data...');

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } catch (error) {
      console.error(
        '❌ Failed'
      );
    }
  };

  /**
   * Initialize Telegram WebApp if available
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const telegramWebApp = (window as any).Telegram?.WebApp;

      if (telegramWebApp) {
        telegramWebApp.ready();
        telegramWebApp.expand();

        console.log(
          '📱 [Telegram WebApp] Initialized successfully'
        );

        console.log(
          '📱 [Telegram WebApp] initData available:',
          !!telegramWebApp.initData
        );

        console.log(
          '📱 [Telegram WebApp] initDataUnsafe:',
          telegramWebApp.initDataUnsafe
        );
      } else {
        console.log(
          'ℹ️ [Telegram WebApp] Telegram WebApp API not detected'
        );
      }

      console.log(
        '🌐 [Auth] Current URL:',
        window.location.href
      );

      console.log(
        '🔑 [Auth] Current code:',
        new URLSearchParams(window.location.search).get('code')
      );
    } catch (error) {
      console.error(
        '❌ [Telegram WebApp] Initialization error:',
        error
      );
    }
  }, []);

  /**
   * Authentication process
   *
   * IMPORTANT ORDER:
   *
   * 1. Telegram one-time code
   * 2. Existing React session
   * 3. Existing localStorage session
   * 4. Not authenticated
   */
  useEffect(() => {
    let isMounted = true;

    const handleAuth = async () => {
      console.log('========================================');
      console.log('🔐 [Telegram Auth] Starting authentication');
      console.log('========================================');

      try {
        // =====================================================
        // CASE 1:
        // TELEGRAM BINGO CODE
        //
        // IMPORTANT:
        // This MUST happen BEFORE checking user/localStorage.
        // =====================================================

        const code = searchParams.get('code');

        console.log(
          '🔎 [Telegram Auth] URL code:',
          code
        );

        if (code) {
          // Prevent duplicate exchange
          if (isExchangingRef.current) {
            console.log(
              '⏳ [Telegram Auth] Code exchange already in progress...'
            );

            return;
          }

          isExchangingRef.current = true;

          console.log(
            '🤖 [Telegram Auth] One-time Bingo code detected:',
            code
          );

          // ---------------------------------------------------
          // IMPORTANT:
          // Remove old session BEFORE authenticating the new
          // Telegram Bingo user.
          // ---------------------------------------------------

          clearOldSession();

          if (isMounted) {
            setIsLoading(true);

            setPopup({
              show: true,
              type: 'info',
              message:
                'Validating single-use Telegram access code...'
            });
          }

          try {
            console.log(
              '🔄 [Telegram Auth] Sending code to backend...'
            );

            console.log(
              '🔄 [Telegram Auth] Endpoint:',
              '/auth/exchange-game-code'
            );

            const response = await api.post(
              '/auth/exchange-game-code',
              {
                code: code
              }
            );

            console.log(
              '📥 [Telegram Auth] Backend response:',
              response.data
            );

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            if (
              response.data &&
              response.data.success === true
            ) {
              const responseData = response.data.data;

              const token = responseData?.token;
              const userData = responseData?.user;

              console.log(
                '🎉 [Telegram Auth] Code validated successfully!'
              );

              console.log(
                '👤 [Telegram Auth] User:',
                userData
              );

              console.log(
                '🔑 [Telegram Auth] Token received:',
                !!token
              );

              // Validate backend response
              if (!token || !userData) {
                throw new Error(
                  'Error.'
                );
              }

              // -------------------------------------------------
              // Save NEW authenticated session
              // -------------------------------------------------

              try {
                localStorage.setItem(
                  'token',
                  token
                );

                localStorage.setItem(
                  'user',
                  JSON.stringify(userData)
                );

                sessionStorage.setItem(
                  'token',
                  token
                );

                sessionStorage.setItem(
                  'user',
                  JSON.stringify(userData)
                );

                console.log(
                  '💾 [Telegram Auth] New session saved successfully'
                );
              } catch (storageError) {
                console.error(
                  '❌ Error...',
                  storageError
                );
              }

              // -------------------------------------------------
              // Update React Auth Context
              // -------------------------------------------------

              if (setSession) {
                console.log(
                  '🔄 [Telegram Auth] Updating React Auth Context...'
                );

                setSession(
                  userData,
                  token
                );
              }

              if (isMounted) {
                setIsAuthenticated(true);
                setIsLoading(false);

                setPopup({
                  show: true,
                  type: 'success',
                  message:
                    'Authentication successful! Welcome to the game.'
                });
              }

              // -------------------------------------------------
              // Remove ?code= from URL
              //
              // Example:
              //
              // BEFORE:
              // /user/lobby?code=ABC123
              //
              // AFTER:
              // /user/lobby
              // -------------------------------------------------

              console.log(
                '🧹 [Telegram Auth] Removing code from URL...'
              );

              router.replace(
                window.location.pathname
              );

              console.log(
                '✅ [Telegram Auth] Authentication completed successfully'
              );

              return;
            }

            // -------------------------------------------------
            // CODE EXCHANGE FAILED
            // -------------------------------------------------

            const errorMessage =
              response.data?.message ||
              'Code exchange failed on backend.';

            console.error(
              '❌ [Telegram Auth] Code exchange rejected:',
              errorMessage
            );

            clearOldSession();

            if (isMounted) {
              setIsAuthenticated(false);
              setIsLoading(false);

              setPopup({
                show: true,
                type: 'error',
                message:
                  `Telegram Login Failed`
              });
            }

            return;
          } catch (error: any) {
            // -------------------------------------------------
            // REQUEST ERROR
            // -------------------------------------------------

            console.error(
              '❌ [Telegram Auth] Exception during code exchange:',
              error
            );

            const serverError =
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              error?.message ||
              'Network error while connecting to authentication server.';

            console.error(
              '❌ [Telegram Auth] Server error:',
              serverError
            );

            console.error(
              '❌ [Telegram Auth] HTTP status:',
              error?.response?.status
            );

            console.error(
              '❌ [Telegram Auth] HTTP response:',
              error?.response?.data
            );

            clearOldSession();

            if (isMounted) {
              setIsAuthenticated(false);
              setIsLoading(false);

              setPopup({
                show: true,
                type: 'error',
                message:
                  `Authentication Error`
              });
            }

            return;
          }
        }

        // =====================================================
        // CASE 2:
        // EXISTING REACT AUTH SESSION
        //
        // Only use this when there is NO ?code=
        // =====================================================

        if (user) {
          console.log(
            '✅ [Auth] Existing React session found:',
            user
          );

          if (isMounted) {
            setIsAuthenticated(true);
            setIsLoading(false);
          }

          return;
        }

        // =====================================================
        // CASE 3:
        // EXISTING LOCAL STORAGE SESSION
        //
        // Only use this when there is NO ?code=
        // =====================================================

        const storedToken =
          localStorage.getItem('token');

        const storedUser =
          localStorage.getItem('user');

        console.log(
          '📦 [Auth] Stored token exists:',
          !!storedToken
        );

        console.log(
          '📦 [Auth] Stored user exists:',
          !!storedUser
        );

        if (
          storedToken &&
          storedUser
        ) {
          try {
            const parsedUser =
              JSON.parse(storedUser);

            console.log(
              '📦 [Auth] Restoring existing session:',
              parsedUser
            );

            if (setSession) {
              setSession(
                parsedUser,
                storedToken
              );
            }

            if (isMounted) {
              setIsAuthenticated(true);
              setIsLoading(false);
            }

            return;
          } catch (error) {
            console.error(
              '❌ [Auth] Failed to parse stored user:',
              error
            );

            clearOldSession();
          }
        }

        // =====================================================
        // CASE 4:
        // NO AUTHENTICATION
        // =====================================================

        console.log(
          'ℹ️ [Auth] No active session or Telegram code found.'
        );

        if (isMounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      } catch (error) {
        // =====================================================
        // GLOBAL AUTH ERROR
        // =====================================================

        console.error(
          '❌ [Auth] Unexpected authentication error:',
          error
        );

        if (isMounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    handleAuth();

    // Cleanup
    return () => {
      isMounted = false;
    };

  }, [
    searchParams,
    router,
    user,
    setSession
  ]);

  return {
    isLoading,
    isAuthenticated,
    user,
    popup,
    closePopup
  };
};