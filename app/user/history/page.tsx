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

  // NEW: Background color state
  const [backgroundColor, setBackgroundColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('bingoBgColor');
      return savedColor || 'white';
    }
    return 'white';
  });

  // Color helper functions
  const getTextColor = () => {
    switch(backgroundColor) {
      case 'black': return 'white';
      case 'green': return 'white';
      case 'blue': return 'white';
      case 'yellow': return 'black';
      default: return 'black';
    }
  };

  const getCardBackground = () => {
    switch(backgroundColor) {
      case 'black': return 'rgba(50, 50, 50, 0.95)';
      case 'green': return 'rgba(30, 70, 30, 0.95)';
      case 'blue': return 'rgba(30, 50, 80, 0.95)';
      case 'yellow': return 'rgba(240, 230, 140, 0.95)';
      default: return 'rgba(255, 255, 255, 0.95)';
    }
  };

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
      className="p-6 rounded-lg shadow-md"
      style={{ backgroundColor: getCardBackground(), color: getTextColor() }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center" style={{ color: getTextColor() }}>
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
          <Clock className="h-12 w-12 mx-auto mb-4" style={{ color: getTextColor(), opacity: 0.4 }} />
          <p style={{ color: getTextColor(), opacity: 0.7 }}>No games played yet.</p>
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
                className="flex justify-between items-center p-4 border-b border-gray-100 hover:opacity-80 transition-colors"
                style={{ borderColor: getTextColor() + '20' }}
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
                    <p className="font-medium" style={{ color: getTextColor() }}>Bingo Game #{game._id.slice(-4)}</p>
                    <p className="text-sm" style={{ color: getTextColor(), opacity: 0.7 }}>
                      {formatDate(game.createdAt)} • {game.numberOfPlayers} players
                    </p>
                    <p className="text-sm" style={{ color: getTextColor(), opacity: 0.7 }}>
                      Bet: {formatCurrency(game.betAmount)} • Prize: {formatCurrency(game.prizePool)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isWinner ? 'text-green-600' : ''}`} style={{ color: isWinner ? '#22c55e' : getTextColor() }}>
                    {isWinner ? 'Won' : 'Lost'}
                  </p>
                  <p className="text-sm" style={{ color: getTextColor(), opacity: 0.7 }}>Card #{game.winnerCard}</p>
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
      className="p-6 rounded-lg shadow-md"
      style={{ backgroundColor: getCardBackground(), color: getTextColor() }}
    >
      <h2 className="text-xl font-bold mb-4 flex items-center" style={{ color: getTextColor() }}>
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
          <Award className="h-12 w-12 mx-auto mb-4" style={{ color: getTextColor(), opacity: 0.4 }} />
          <p style={{ color: getTextColor(), opacity: 0.7 }}>No winnings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {winnings.map((winning) => (
            <motion.div
              key={winning._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-between items-center p-4 border-b border-gray-100 hover:opacity-80 transition-colors"
              style={{ borderColor: getTextColor() + '20' }}
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100">
                  <Award className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="font-medium" style={{ color: getTextColor() }}>Game #{winning.gameId.slice(-4)}</p>
                  <p className="text-sm capitalize" style={{ color: getTextColor(), opacity: 0.7 }}>
                    {winning.pattern.replace(/-/g, ' ')} • {formatDate(winning.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">+{formatCurrency(winning.amount)}</p>
                <p className="text-sm" style={{ color: getTextColor(), opacity: 0.7 }}>Prize</p>
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
        className="p-6 rounded-lg shadow-md"
        style={{ backgroundColor: getCardBackground(), color: getTextColor() }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center" style={{ color: getTextColor() }}>
          <Calendar className="mr-2 h-5 w-5 text-purple-600" />
          Your Stats
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
            <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{totalGames}</p>
            <p className="text-sm" style={{ color: '#3b82f6' }}>Total Games</p>
          </div>
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
            <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{gamesWon}</p>
            <p className="text-sm" style={{ color: '#22c55e' }}>Games Won</p>
          </div>
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)' }}>
            <p className="text-2xl font-bold" style={{ color: '#eab308' }}>
              {formatCurrency(totalWinnings)}
            </p>
            <p className="text-sm" style={{ color: '#eab308' }}>Total Winnings</p>
          </div>
          <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
            <p className="text-2xl font-bold" style={{ color: '#a855f7' }}>
              {winRate}%
            </p>
            <p className="text-sm" style={{ color: '#a855f7' }}>Win Rate</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: backgroundColor, color: getTextColor() }}>
      <MobileHeader title="History" />
      
      <div className="p-4 px-0 space-y-6 pb-24 pt-16">
        <StatsOverview />
        
        {/* Tab Navigation */}
        <div className="flex rounded-lg shadow-sm p-1" style={{ backgroundColor: getCardBackground() }}>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${activeTab === 'games' ? 'text-white' : ''}`}
            style={{ 
              backgroundColor: activeTab === 'games' ? '#3b82f6' : 'transparent',
              color: activeTab === 'games' ? 'white' : getTextColor()
            }}
            onClick={() => setActiveTab('games')}
          >
            Games
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md text-center font-medium ${activeTab === 'winnings' ? 'text-white' : ''}`}
            style={{ 
              backgroundColor: activeTab === 'winnings' ? '#eab308' : 'transparent',
              color: activeTab === 'winnings' ? 'white' : getTextColor()
            }}
            onClick={() => setActiveTab('winnings')}
          >
            Winnings
          </button>
        </div>
        
        {activeTab === 'games' ? <GameHistory /> : <WinningsHistory />}
      </div>

      <MobileNavigation />
    </div>
  );
}