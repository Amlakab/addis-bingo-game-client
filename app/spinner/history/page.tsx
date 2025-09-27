// app/user/history/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import MobileHeader from '@/components/spinner-user/MobileHeader';
import MobileNavigation from '@/components/spinner-user/MobileNavigation';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Trophy, Calendar, Clock, Award, XCircle, CheckCircle, Users, DollarSign } from 'lucide-react';
import api from '@/app/utils/api';

interface SpinnerHistory {
  _id: string;
  winnerId: {
    _id: string;
    phone: string;
  };
  winnerNumber: number;
  prizePool: number;
  numberOfPlayers: number;
  betAmount: number;
  selectedNumbers: number[];
  createdAt: string;
}

interface Earning {
  _id: string;
  gameId: string;
  amount: number;
  createdAt: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<SpinnerHistory[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [activeTab, setActiveTab] = useState('games');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError('');
        
        // Fetch spinner history for the current user
        const response = await api.get(`/spinner/history/user/${user._id}`);
        const spinnerHistory: SpinnerHistory[] = response.data;
        
        setGames(spinnerHistory);
        
        // Calculate earnings as 20% of (numberOfPlayers * betAmount)
        const userEarnings: Earning[] = spinnerHistory.map(game => {
          const earningAmount = Math.floor(game.numberOfPlayers * game.betAmount * 0.2);
          
          return {
            _id: game._id + '-earning',
            gameId: game._id,
            amount: earningAmount,
            createdAt: game.createdAt
          };
        });
        
        setEarnings(userEarnings);
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

  // Helper function to format date strings
  const formatDateString = (dateString: string) => {
    return formatDate(new Date(dateString));
  };

  const GameHistory = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Clock className="mr-2 h-5 w-5 text-blue-600" />
        Recent Spinner Games
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
          <p className="text-gray-600">No spinner games played yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {games.map((game) => {
            const isWinner = game.winnerId._id === user._id;
            const earningAmount = Math.floor(game.numberOfPlayers * game.betAmount * 0.2);
            
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
                    <p className="font-medium">Spinner Game #{game._id.slice(-4)}</p>
                    <p className="text-sm text-gray-500">
                      {formatDateString(game.createdAt)} • {game.numberOfPlayers} players
                    </p>
                    <p className="text-sm text-gray-500">
                      Bet: {formatCurrency(game.betAmount)} • Prize: {formatCurrency(game.prizePool)}
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                      Earning: {formatCurrency(earningAmount)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isWinner ? 'text-green-600' : 'text-gray-600'}`}>
                    {isWinner ? 'Won' : 'Lost'}
                  </p>
                  <p className="text-sm text-gray-500">#{game.winnerNumber}</p>
                  <div className="flex items-center justify-end mt-1">
                    <Users className="h-3 w-3 mr-1 text-gray-400" />
                    <span className="text-xs text-gray-500">{game.selectedNumbers.length} cards</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  const EarningsHistory = () => {
    const totalEarnings = earnings.reduce((total, earning) => total + earning.amount, 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <DollarSign className="mr-2 h-5 w-5 text-green-600" />
          Your Earnings
        </h2>

        {/* Earnings Summary */}
        <div className="bg-green-50 p-4 rounded-lg text-center mb-6">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEarnings)}</p>
          <p className="text-sm text-green-600">Total Earnings</p>
        </div>
        
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
        ) : earnings.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No earnings yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {earnings.map((earning) => {
              const game = games.find(g => g._id === earning.gameId);
              
              return (
                <motion.div
                  key={earning._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-between items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-green-100">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">Game Earning</p>
                      <p className="text-sm text-gray-500">
                        Spinner Game #{earning.gameId.slice(-4)} • {formatDateString(earning.createdAt)}
                      </p>
                      {game && (
                        <p className="text-xs text-gray-400">
                          {game.numberOfPlayers} players × {formatCurrency(game.betAmount)} bet
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(earning.amount)}
                    </p>
                    <p className="text-sm text-gray-500">Earning</p>
                    {game && (
                      <p className="text-xs text-gray-400">20% of pool</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };

  const StatsOverview = () => {
    const totalGames = games.length;
    const gamesWon = games.filter(game => game.winnerId._id === user._id).length;
    const totalEarningsAmount = earnings.reduce((total, earning) => total + earning.amount, 0);
    const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;
    const totalBetAmount = games.reduce((total, game) => total + (game.betAmount * game.selectedNumbers.length), 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-purple-600" />
          Your Spinner Stats
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
              {formatCurrency(totalEarningsAmount)}
            </p>
            <p className="text-sm text-yellow-600">Total Earnings</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600">
              {winRate}%
            </p>
            <p className="text-sm text-purple-600">Win Rate</p>
          </div>
        </div>
        
        {/* Additional Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="font-semibold text-gray-700">{formatCurrency(totalBetAmount)}</p>
              <p className="text-gray-500">Total Bet</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">
                {games.reduce((total, game) => total + game.selectedNumbers.length, 0)}
              </p>
              <p className="text-gray-500">Cards Played</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Spinner History" />
      
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
            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${activeTab === 'earnings' ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('earnings')}
          >
            Earnings
          </button>
        </div>
        
        {activeTab === 'games' ? <GameHistory /> : <EarningsHistory />}
      </div>

      <MobileNavigation />
    </div>
  );
}