// app/user/history/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Trophy, Calendar, Clock, Award, XCircle, CheckCircle } from 'lucide-react';
import api from '@/app/utils/api';
import Footer from '@/components/ui/Footer';

interface GameHistory {
  _id: string;
  winnerId: {
    _id: string;
    phone: string;
  };
  winnerCard: number;
  prizePool: number;
  numberOfPlayers: number;
  betAmount: number;
  createdAt: Date;
  __v: number;
}

interface Winning {
  _id: string;
  gameId: string;
  amount: number;
  pattern: string;
  createdAt: Date;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameHistory[]>([]);
  const [winnings, setWinnings] = useState<Winning[]>([]);
  const [activeTab, setActiveTab] = useState('games');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError('');
        
        // Fetch game history for the current user
        const response = await api.get(`/game/history/user/${user._id}`);
        const gameHistory: GameHistory[] = response.data;
        
        setGames(gameHistory);
        
        // Transform game history into winnings format
        const userWinnings: Winning[] = gameHistory.map(game => ({
          _id: game._id,
          gameId: game._id,
          amount: game.prizePool,
          pattern: 'winning-pattern', // You might want to update this based on your actual data
          createdAt: new Date(game.createdAt)
        }));
        
        setWinnings(userWinnings);
      } catch (error: any) {
        console.error('Failed to fetch history:', error);
        setError(error.response?.data?.error || 'Failed to fetch history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (!user) {
    return null;
  }

  const GameHistory = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-md "
    >
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Clock className="mr-2 h-5 w-5 text-blue-600" />
        Recent Games
      </h2>
      
      {error ? (
        <div className="text-center py-8">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex justify-between items-center p-4 border-b border-gray-100 animate-pulse">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No games played yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((game) => {
            const isWinner = game.winnerId._id === user._id;
            const totalBetAmount = game.betAmount; // This represents the user's bet amount
            
            return (
              <motion.div
                key={game._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-full ${isWinner ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {isWinner ? (
                      <Trophy className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Bingo Game #{game._id.slice(-4)}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(game.createdAt)} • {game.numberOfPlayers} players
                    </p>
                    <p className="text-sm text-gray-500">
                      Bet: {formatCurrency(game.betAmount)} • Prize: {formatCurrency(game.prizePool)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isWinner ? 'text-green-600' : 'text-gray-600'}`}>
                    {isWinner ? 'Won' : 'Lost'}
                  </p>
                  <p className="text-sm text-gray-500">Card #{game.winnerCard}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  const WinningsHistory = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Award className="mr-2 h-5 w-5 text-yellow-600" />
        Your Winnings
      </h2>
      
      {error ? (
        <div className="text-center py-8">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="flex justify-between items-center p-4 border-b border-gray-100 animate-pulse">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : winnings.length === 0 ? (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No winnings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winnings.map((winning) => (
            <motion.div
              key={winning._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100">
                  <Award className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="font-medium">Game #{winning.gameId.slice(-4)}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {winning.pattern.replace(/-/g, ' ')} • {formatDate(winning.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">+{formatCurrency(winning.amount)}</p>
                <p className="text-sm text-gray-500">Prize</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const StatsOverview = () => {
    const totalGames = games.length;
    const gamesWon = games.filter(game => game.winnerId._id === user._id).length;
    const totalWinnings = winnings.reduce((total, winning) => total + winning.amount, 0);
    const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-purple-600" />
          Your Stats
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{totalGames}</p>
            <p className="text-sm text-blue-600">Total Games</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{gamesWon}</p>
            <p className="text-sm text-green-600">Games Won</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalWinnings)}
            </p>
            <p className="text-sm text-yellow-600">Total Winnings</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600">
              {winRate}%
            </p>
            <p className="text-sm text-purple-600">Win Rate</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="History" />
      
      <div className="p-4 px-0 space-y-6 pb-24 pt-16">
        <StatsOverview />
        
        {/* Tab Navigation */}
        <div className="flex bg-white rounded-lg shadow-sm p-1">
          <button
            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${activeTab === 'games' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('games')}
          >
            Games
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${activeTab === 'winnings' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('winnings')}
          >
            Winnings
          </button>
        </div>
        
        {activeTab === 'games' ? <GameHistory /> : <WinningsHistory />}
      </div>
      <Footer />

      <MobileNavigation />
    </div>
  );
}