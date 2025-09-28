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
  const [language, setLanguage] = useState<'en' | 'am'>('en');
  const [players, setPlayers] = useState<PlayerSelection[]>([]);
  const [bet, setBet] = useState(0);
  const [earningsPercentage, setEarningsPercentage] = useState(20);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentPage, setCurrentPage] = useState<'bet-selection' | 'player-lobby'>('bet-selection');
  const [remainingTime, setRemainingTime] = useState(45);
  const [createdAt, setCreatedAt] = useState<Date>(new Date());
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  const handlePlay = (betAmount: number, timeRemaining: number, playerCount: number, createdAt: Date) => {
    setBet(betAmount);
    setRemainingTime(timeRemaining);
    setCreatedAt(createdAt);
    setCurrentPage('player-lobby');
  };

  const handleStartGame = async (selectedPlayers: PlayerSelection[], betAmount: number) => {
    setPlayers(selectedPlayers);
    setBet(betAmount);
    
    // Update game sessions status to playing (only when timer reaches 0)
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

  // Handle direct navigation to game (without updating session status)
  const handleDirectToGame = (selectedPlayers: PlayerSelection[], betAmount: number) => {
    setPlayers(selectedPlayers);
    setBet(betAmount);
    setGameStarted(true); // Directly go to game without updating status
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
    // Keep players and bet intact, just go back to player lobby
    setCurrentPage('player-lobby');
  };

  if (gameStarted) {
    return (
      <div className="min-h-screen bg-gray-50 pb-5">
        <main className="p-2 px-0">
          <GameInterface
            players={players}
            bet={bet}
            onGameEnd={handleGameEnd}
            onBackToPlayerLobby={handleBackToPlayerLobby}
            language={language}
            earningsPercentage={earningsPercentage}
            setLanguage={setLanguage}
          />
        </main>
        {/* <MobileNavigation /> */}
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gray-50 pb-20">
    <MobileHeader title="Game Lobby" showWallet={true} />
    
    <main className="p-4 px-0 pb-24 pt-16">
      {currentPage === 'bet-selection' ? (
        <BetSelectionPage 
          onPlay={handlePlay}
          language={language}
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
        />
      )}
    </main>
    <Footer />

    {currentPage === 'bet-selection' && <MobileNavigation />}
  </div>
);
}