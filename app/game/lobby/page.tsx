'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Game } from '@/types';
import { formatDate } from '@/lib/utils';

export default function GameLobby() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/games', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setGames(data);
        }
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  const filteredGames = filter === 'all' 
    ? games 
    : games.filter(game => game.cardCount === parseInt(filter));

  if (isLoading) {
    return <div className="text-center py-8">Loading games...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Game Lobby</h1>
      
      <div className="mb-6">
        <label htmlFor="filter" className="block text-sm font-medium mb-2">
          Filter by Card Count
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="all">All Games</option>
          <option value="20">20 Cards</option>
          <option value="30">30 Cards</option>
          <option value="40">40 Cards</option>
          <option value="50">50 Cards</option>
          <option value="100">100 Cards</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game) => (
          <div key={game._id} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2">{game.name}</h2>
            <p className="text-gray-600 mb-2">Cards: {game.cardCount}</p>
            <p className="text-gray-600 mb-2">Status: <span className="capitalize">{game.status}</span></p>
            <p className="text-gray-600 mb-4">Start: {formatDate(game.startTime)}</p>
            
            {game.status === 'waiting' && (
              <Link
                href={`/game/${game._id}`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded block text-center"
              >
                Join Game
              </Link>
            )}
            
            {game.status === 'active' && (
              <Link
                href={`/game/${game._id}`}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded block text-center"
              >
                Watch Game
              </Link>
            )}
            
            {game.status === 'completed' && (
              <button
                disabled
                className="bg-gray-400 text-white px-4 py-2 rounded block text-center w-full"
              >
                Game Ended
              </button>
            )}
          </div>
        ))}
      </div>
      
      {filteredGames.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No games available.</p>
        </div>
      )}
    </div>
  );
}