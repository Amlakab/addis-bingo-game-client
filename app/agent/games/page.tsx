'use client';

import React, { useState, useEffect } from 'react';
import { Game } from '@/types';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export default function AgentGamesPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'agent') return;

    const fetchGames = async () => {
      try {
        const response = await fetch('/api/agent/games', {
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
  }, [user]);

  if (user?.role !== 'agent') {
    return <div className="text-center py-8 text-red-600">Access denied. Agent only.</div>;
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading games...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Game Monitoring</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Cards</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Start Time</th>
                <th className="px-4 py-2 text-left">Players</th>
                <th className="px-4 py-2 text-left">Winner</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game._id} className="border-b">
                  <td className="px-4 py-2">{game.name}</td>
                  <td className="px-4 py-2">{game.cardCount}</td>
                  <td className="px-4 py-2 capitalize">{game.status}</td>
                  <td className="px-4 py-2">{formatDate(game.startTime)}</td>
                  <td className="px-4 py-2">24</td>
                  <td className="px-4 py-2">{game.winner || 'No winner'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}