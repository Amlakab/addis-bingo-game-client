'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import GameBoard from '@/components/game/GameBoard';
import { connectSocket, getSocket, disconnectSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth';

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  const { user } = useAuth();
  
  const [game, setGame] = useState<any>(null);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const [gameResponse, cardsResponse] = await Promise.all([
          fetch(`/api/games/${gameId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }),
          fetch(`/api/games/${gameId}/cards`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }),
        ]);
        
        if (gameResponse.ok && cardsResponse.ok) {
          const gameData = await gameResponse.json();
          const cardsData = await cardsResponse.json();
          
          setGame(gameData);
          setUserCards(cardsData);
          
          // Connect to socket for real-time updates
          const socket = connectSocket(localStorage.getItem('token') || '');
          socket.emit('joinGame', { gameId });
        } else {
          setError('Failed to load game data');
        }
      } catch (error) {
        console.error('Failed to fetch game data:', error);
        setError('Failed to load game');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();

    return () => {
      const socket = getSocket();
      if (socket) {
        socket.emit('leaveGame', { gameId });
        disconnectSocket();
      }
    };
  }, [gameId]);

  if (isLoading) {
    return <div className="text-center py-8">Loading game...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!game) {
    return <div className="text-center py-8">Game not found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{game.name}</h1>
      <GameBoard game={game} userCards={userCards} />
    </div>
  );
}