'use client';

import { useTelegramAuth } from '@/app/utils/useTelegramAuth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FullSelectionPage from '@/components/player/FullSelectionPage';
import FullPlayerLobby from '@/components/player/FullPlayerLobby';
import FullGameInterface from '@/components/player/FullGameInterface';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';

interface PlayerSelection {
  id: number;
  userId: string;
}

export default function FullGamePage() {
  const router = useRouter();
  const [language, setLanguage] = useState<'am' | 'en'>('am');
  const [players, setPlayers] = useState<PlayerSelection[]>([]);
  const [bet, setBet] = useState(0);
  const [gameId, setGameId] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPage, setCurrentPage] = useState<'selection' | 'player-lobby'>('selection');

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
    switch (backgroundColor) {
      case 'black': return 'white';
      case 'green': return 'white';
      case 'blue': return 'white';
      case 'yellow': return 'black';
      default: return 'black';
    }
  };

  // Loading state
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
    return null;
  }

  // Navigation handlers
  const handlePlay = (selectedGameId: string, betAmount: number) => {
    setGameId(selectedGameId);
    setBet(betAmount);
    setCurrentPage('player-lobby');
  };

  const handleStartGame = (selectedPlayers: PlayerSelection[], betAmount: number, targetGameId: string) => {
    setPlayers(selectedPlayers);
    setBet(betAmount);
    setGameId(targetGameId);
    setGameStarted(true);
  };

  const handleDirectToGame = (selectedPlayers: PlayerSelection[], betAmount: number, targetGameId: string) => {
    setPlayers(selectedPlayers);
    setBet(betAmount);
    setGameId(targetGameId);
    setGameStarted(true);
  };

  const handleBackToSelection = () => {
    setCurrentPage('selection');
    setPlayers([]);
    setBet(0);
    setGameId('');
  };

  const handleGameEnd = () => {
    setGameStarted(false);
    setPlayers([]);
    setBet(0);
    setGameId('');
    setCurrentPage('selection');
  };

  const handleBackToPlayerLobby = () => {
    setGameStarted(false);
    setCurrentPage('player-lobby');
  };

  // Live Game View (Matches Partial Game Layout without persistent headers)
  if (gameStarted && gameId && bet > 0) {
    return (
      <div 
        className="min-h-screen pb-5"
        style={{ 
          backgroundColor: backgroundColor,
          color: getTextColor()
        }}
      >
        <main className="p-2 px-0">
          <FullGameInterface
            players={players}
            bet={bet}
            gameId={gameId}
            onGameEnd={handleGameEnd}
            onBackToPlayerLobby={handleBackToPlayerLobby}
            language={language}
            setLanguage={setLanguage}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
          />
        </main>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ 
        backgroundColor: backgroundColor,
        color: getTextColor()
      }}
    >
      {/* MobileHeader only visible on the Selection page */}
      {currentPage === 'selection' && (
        <MobileHeader 
          title="Full Games" 
          showWallet={true}
        />
      )}
      
      {/* Dynamic top padding: pt-16 for selection, pt-0 for lobby */}
      <main className={`
        p-4 px-0 pb-24 
        ${currentPage === 'selection' ? 'pt-16' : 'pt-0'}
      `}>
        {currentPage === 'selection' ? (
          <FullSelectionPage 
            onPlay={handlePlay}
            language={language}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
          />
        ) : (
          <FullPlayerLobby 
            onStartGame={handleStartGame}
            onDirectToGame={handleDirectToGame}
            gameId={gameId}
            betAmount={bet}
            language={language}
            setLanguage={setLanguage}
            onBackToLobby={handleBackToSelection}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
          />
        )}
      </main>

      {/* MobileNavigation only visible on the Selection page */}
      {currentPage === 'selection' && (
        // <MobileNavigation />
      )}
    </div>
  );
}