'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BetSelectionPage from '@/components/player/BetSelectionPage';
import PlayerLobby from '@/components/player/PlayerLobby';
import GameInterface from '@/components/player/GameInterface';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import { useAuth } from '@/lib/auth';
import api from '@/app/utils/api';

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
  const [language, setLanguage] = useState<'en' | 'am'>('en');
  const [players, setPlayers] = useState<PlayerSelection[]>([]);
  const [bet, setBet] = useState(0);
  const [earningsPercentage, setEarningsPercentage] = useState(20);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPage, setCurrentPage] = useState<'bet-selection' | 'player-lobby'>('bet-selection');
  const [remainingTime, setRemainingTime] = useState(45);
  const [createdAt, setCreatedAt] = useState<Date>(new Date()); // Add createdAt state
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is logged in
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handlePlay = (betAmount: number, timeRemaining: number, playerCount: number, createdAt: Date) => {
    setBet(betAmount);
    setRemainingTime(timeRemaining);
    setCreatedAt(createdAt); // Store the createdAt time
    setCurrentPage('player-lobby');
  };

  const handleStartGame = async (selectedPlayers: PlayerSelection[], betAmount: number) => {
    setPlayers(selectedPlayers);
    setBet(betAmount);
    
    // Update game sessions status to playing
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

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Bingo Game" showWallet={true} />
        
        <main className="p-4">
          <GameInterface
            players={players}
            bet={bet}
            onGameEnd={handleGameEnd}
            language={language}
            earningsPercentage={earningsPercentage}
            setLanguage={setLanguage}
          />
        </main>

        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Game Lobby" showWallet={true} />
      
      <main className="p-4">
        {currentPage === 'bet-selection' ? (
          <BetSelectionPage 
            onPlay={handlePlay}
            language={language}
          />
        ) : (
          <PlayerLobby 
            onStartGame={handleStartGame}
            initialBet={bet}
            initialTime={remainingTime}
            createdAt={createdAt} // Pass createdAt to PlayerLobby
            language={language}
            setLanguage={setLanguage}
            onBackToLobby={handleBackToLobby} // Add back to lobby handler
          />
        )}
      </main>

      <MobileNavigation />
    </div>
  );
}