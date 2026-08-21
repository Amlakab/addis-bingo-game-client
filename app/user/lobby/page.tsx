'use client';

import { useTelegramAuth } from '@/app/utils/useTelegramAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BetSelectionPage from '@/components/player/BetSelectionPage';
import PlayerLobby from '@/components/player/PlayerLobby';
import GameInterface from '@/components/player/GameInterface';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import { useAuth } from '@/lib/auth';
import api from '@/app/utils/api';
import Footer from '@/components/ui/Footer';

interface PlayerSelection {
  id: number;
  userId: string;
}

interface GameSession {
  _id: string;
  userId: string;
  cardNumber: number;
  betAmount: number;
  status: string;
}

export default function LobbyPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<'am' | 'en'>('am');
  const [players, setPlayers] = useState<PlayerSelection[]>([]);
  const [bet, setBet] = useState(0);
  const [earningsPercentage, setEarningsPercentage] = useState(20);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPage, setCurrentPage] = useState<'bet-selection' | 'player-lobby'>('bet-selection');
  const [remainingTime, setRemainingTime] = useState(45);
  const [createdAt, setCreatedAt] = useState<Date>(new Date());

  // NEW: Background color state with localStorage persistence
  const [backgroundColor, setBackgroundColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('bingoBgColor');
      return savedColor || 'white';
    }
    return 'white';
  });

  const { isLoading, isAuthenticated, user } = useTelegramAuth();

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

  const handlePlay = (betAmount: number, timeRemaining: number, playerCount: number, createdAt: Date) => {
    setBet(betAmount);
    setRemainingTime(timeRemaining);
    setCreatedAt(createdAt);
    setCurrentPage('player-lobby');
  };

  const handleStartGame = async (selectedPlayers: PlayerSelection[], betAmount: number) => {
    setPlayers(selectedPlayers);
    setBet(betAmount);
    
    try {
      for (const player of selectedPlayers) {
        const response = await api.get(`/game/sessions/card/${player.id}`);
        const session: GameSession = response.data;
        
        if (session) {
          await api.put(`/game/session/${session._id}/status`, {
            status: 'playing'
          });
        }
      }
      
      setGameStarted(true);
    } catch (error) {
      console.error('Error updating game sessions:', error);
    }
  };

  const handleDirectToGame = (selectedPlayers: PlayerSelection[], betAmount: number) => {
    setPlayers(selectedPlayers);
    setBet(betAmount);
    setGameStarted(true);
  };

  const handleBackToLobby = () => {
    setCurrentPage('bet-selection');
  };

  const handleGameEnd = async () => {
    setGameStarted(false);
    setPlayers([]);
    setBet(0);
    setCurrentPage('bet-selection');
    setRemainingTime(45);
  };

  const handleBackToPlayerLobby = () => {
    setGameStarted(false);
    setCurrentPage('player-lobby');
  };

  if (gameStarted) {
    return (
      <div 
        className="min-h-screen pb-5"
        style={{ 
          backgroundColor: backgroundColor,
          color: getTextColor()
        }}
      >
        <main className="p-2 px-0">
          <GameInterface
            players={players}
            bet={bet}
            onGameEnd={handleGameEnd}
            onBackToPlayerLobby={handleBackToPlayerLobby}
            language={language}
            earningsPercentage={earningsPercentage}
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
      <MobileHeader 
        title="Game Lobby" 
        showWallet={true}
        backgroundColor={backgroundColor}
      />
      
      <main className="p-4 px-0 pb-24 pt-16">
        {currentPage === 'bet-selection' ? (
          <BetSelectionPage 
            onPlay={handlePlay}
            language={language}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
          />
        ) : (
          <PlayerLobby 
            onStartGame={handleStartGame}
            onDirectToGame={handleDirectToGame}
            initialBet={bet}
            initialTime={remainingTime}
            createdAt={createdAt}
            language={language}
            setLanguage={setLanguage}
            onBackToLobby={handleBackToLobby}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
          />
        )}
      </main>

      {currentPage === 'bet-selection' && (
        <MobileNavigation backgroundColor={backgroundColor} />
      )}
    </div>
  );
}