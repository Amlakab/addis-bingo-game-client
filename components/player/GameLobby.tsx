'use client';

import { useState } from 'react';
import BetSelectionPage from './BetSelectionPage';
import PlayerLobby from './PlayerLobby';

const GameContainer = () => {
  const [currentView, setCurrentView] = useState<'bet-selection' | 'player-lobby'>('bet-selection');
  const [gameParams, setGameParams] = useState<{
    betAmount: number;
    timeRemaining: number;
    players: number;
    createdAt: Date;
  } | null>(null);

  // NEW: Background color state with localStorage persistence
  const [backgroundColor, setBackgroundColor] = useState(() => {
    const savedColor = localStorage.getItem('bingoBgColor');
    return savedColor || 'white';
  });

  const handlePlay = (betAmount: number, timeRemaining: number, players: number, createdAt: Date) => {
    setGameParams({ betAmount, timeRemaining, players, createdAt });
    setCurrentView('player-lobby');
  };

  const handleStartGame = (players: any[], bet: number) => {
    // Handle game start logic
    console.log('Game starting with players:', players, 'and bet:', bet);
  };

  const handleBackToLobby = () => {
    setCurrentView('bet-selection');
  };

  // NEW: Handle direct to game from PlayerLobby
  const handleDirectToGame = (players: any[], bet: number) => {
    // This will be handled by the parent component
    console.log('Direct to game with players:', players, 'and bet:', bet);
  };

  if (currentView === 'player-lobby' && gameParams) {
    return (
      <PlayerLobby
        onStartGame={handleStartGame}
        initialBet={gameParams.betAmount}
        initialTime={gameParams.timeRemaining}
        createdAt={gameParams.createdAt}
        onBackToLobby={handleBackToLobby}
        onDirectToGame={handleDirectToGame}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
      />
    );
  }

  return (
    <BetSelectionPage 
      onPlay={handlePlay}
      backgroundColor={backgroundColor}
      setBackgroundColor={setBackgroundColor}
    />
  );
};

export default GameContainer;