'use client';

import { useState } from 'react';
import FullSelectionPage from './FullSelectionPage';
import FullPlayerLobby from './FullPlayerLobby';
import FullGameInterface from './FullGameInterface';

interface FullGameLobbyProps {
  onBackToMainLobby?: () => void;
  language?: 'en' | 'am';
  backgroundColor?: string;
  setBackgroundColor?: (color: string) => void;
}

interface PlayerSelection {
  id: number;
  userId: string;
}

const FullGameLobby = ({ 
  onBackToMainLobby,
  language = 'am',
  backgroundColor = 'white',
  setBackgroundColor
}: FullGameLobbyProps) => {
  const [currentView, setCurrentView] = useState<'selection' | 'lobby' | 'game'>('selection');
  const [gameParams, setGameParams] = useState<{
    gameId: string;
    betAmount: number;
    players: number;
  } | null>(null);
  const [players, setPlayers] = useState<PlayerSelection[]>([]);
  const [bet, setBet] = useState(0);
  const [gameId, setGameId] = useState('');

  const handlePlay = (gameId: string, betAmount: number, players: number) => {
    setGameParams({ gameId, betAmount, players });
    setGameId(gameId);
    setBet(betAmount);
    setCurrentView('lobby');
  };

  const handleStartGame = (selectedPlayers: PlayerSelection[], betAmount: number, gameId: string) => {
    setPlayers(selectedPlayers);
    setBet(betAmount);
    setGameId(gameId);
    setCurrentView('game');
  };

  const handleDirectToGame = (selectedPlayers: PlayerSelection[], betAmount: number, gameId: string) => {
    setPlayers(selectedPlayers);
    setBet(betAmount);
    setGameId(gameId);
    setCurrentView('game');
  };

  const handleBackToSelection = () => {
    setCurrentView('selection');
    setGameParams(null);
    setPlayers([]);
    setBet(0);
    setGameId('');
  };

  const handleBackToLobby = () => {
    setCurrentView('lobby');
    setPlayers([]);
  };

  const handleGameEnd = () => {
    setCurrentView('selection');
    setGameParams(null);
    setPlayers([]);
    setBet(0);
    setGameId('');
  };

  const handleBackToPlayerLobby = () => {
    setCurrentView('lobby');
  };

  if (currentView === 'game' && gameId && bet > 0) {
    return (
      <FullGameInterface
        players={players}
        bet={bet}
        gameId={gameId}
        onGameEnd={handleGameEnd}
        onBackToPlayerLobby={handleBackToPlayerLobby}
        language={language}
        setLanguage={(lang) => {}}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
      />
    );
  }

  if (currentView === 'lobby' && gameParams) {
    return (
      <FullPlayerLobby
        onStartGame={handleStartGame}
        gameId={gameParams.gameId}
        betAmount={gameParams.betAmount}
        onBackToLobby={handleBackToSelection}
        onDirectToGame={handleDirectToGame}
        language={language}
        setLanguage={(lang) => {}}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
      />
    );
  }

  return (
    <FullSelectionPage 
      onPlay={handlePlay}
      language={language}
      backgroundColor={backgroundColor}
      setBackgroundColor={setBackgroundColor}
    />
  );
};

export default FullGameLobby;