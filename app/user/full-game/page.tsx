'use client';

import { useTelegramAuth } from '@/app/utils/useTelegramAuth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FullGameLobby from '@/components/player/FullGameLobby';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';

export default function FullGamePage() {
  const router = useRouter();
  const [language, setLanguage] = useState<'am' | 'en'>('am');
  
  // Background color state with localStorage persistence
  const [backgroundColor, setBackgroundColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('bingoBgColor');
      return savedColor || 'white';
    }
    return 'white';
  });

  const { isLoading, isAuthenticated } = useTelegramAuth();

  // Get text color based on background
  const getTextColor = () => {
    switch(backgroundColor) {
      case 'black': return 'white';
      case 'green': return 'white';
      case 'blue': return 'white';
      case 'yellow': return 'black';
      default: return 'black';
    }
  };

  // If loading, show loading spinner with background color
  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          backgroundColor: backgroundColor,
          color: getTextColor()
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4" style={{ color: getTextColor() }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const handleBackToMainLobby = () => {
    router.push('/lobby');
  };

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ 
        backgroundColor: backgroundColor,
        color: getTextColor()
      }}
    >
      <MobileHeader 
        title="Full Games" 
        showWallet={true}
      />
      
      <main className="p-4 px-0 pt-16 pb-24">
        <FullGameLobby 
          onBackToMainLobby={handleBackToMainLobby}
          language={language}
          backgroundColor={backgroundColor}
          setBackgroundColor={setBackgroundColor}
        />
      </main>

      {/* <MobileNavigation /> */}
    </div>
  );
}