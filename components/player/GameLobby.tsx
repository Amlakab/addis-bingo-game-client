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

  if (currentView === 'player-lobby' && gameParams) {
    return (
      <PlayerLobby
        onStartGame={handleStartGame}
        initialBet={gameParams.betAmount}
        initialTime={gameParams.timeRemaining}
        createdAt={gameParams.createdAt}
        onBackToLobby={handleBackToLobby}
      />
    );
  }

  return <BetSelectionPage onPlay={handlePlay} />;
};

export default GameContainer;