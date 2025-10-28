'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import { formatCurrency } from '@/lib/utils';
import { Play, Trophy, TrendingUp, Clock, Users, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/app/utils/api';
import Footer from '@/components/ui/Footer';

// ✅ Define Game type
type Game = {
  _id: string;
  betAmount: number;
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

// ✅ Define User type
type UserType = {
  _id: string;
  phone: string;
  password?: string;
  role: 'user' |'disk-user' |'spinner-user' | 'agent' |'accountant' | 'admin';
  wallet: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ✅ Define Transaction type
type TransactionType = {
  _id: string;
  userId: string | null;
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  description: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
};

// ✅ Define Game History type
type GameHistoryType = {
  _id: string;
  winnerId: {
    _id: string;
    phone: string;
  };
  winnerCard: number;
  prizePool: number;
  numberOfPlayers: number;
  betAmount: number;
  createdAt: string;
  __v?: number;
};

// ✅ Define Recent Activity type (union of Transaction and Game History)
type RecentActivityType = {
  type: 'transaction' | 'game_history';
  data: TransactionType | GameHistoryType;
  date: string;
};

// ✅ Define Game Session type for real-time status
type GameSession = {
  _id: string;
  userId: string;
  cardNumber: number;
  betAmount: number;
  status: string;
  createdAt: string;
};

// ✅ Define Game Status type
type GameStatus = {
  status: 'active' | 'in-progress';
  playerCount: number;
  prizePool: number;
};

export default function UserDashboard() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(authUser || null);
  const [games, setGames] = useState<Game[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // 🔹 Fetch full user from backend using localStorage like MobileHeader
 useEffect(() => {
  const fetchUser = async () => {
    if (typeof window === "undefined") return; // ✅ guard

    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser?._id) return;

      const response = await api.get(`/user/${parsedUser._id}`);
      const userData: UserType = response.data.data || response.data;
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchUser();
}, []);


  // 🔹 Fetch games from backend
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoadingGames(true);
        const response = await api.get('/games');
        const gamesData: Game[] = response.data.data || [];
        setGames(gamesData);
      } catch (error) {
        console.error('Failed to load games:', error);
      } finally {
        setLoadingGames(false);
      }
    };

    fetchGames();
  }, []);

  // 🔹 Setup WebSocket for real-time game sessions
  useEffect(() => {
    const setupWebSocket = () => {
      // Simulate WebSocket connection and data fetching
      // In a real implementation, you would use your WebSocket service
      const simulateWebSocketData = () => {
        const mockSessions: GameSession[] = games.map(game => ({
          _id: `session-${game._id}`,
          userId: 'user123',
          cardNumber: Math.floor(Math.random() * 25) + 1,
          betAmount: game.betAmount,
          status: Math.random() > 0.5 ? 'active' : 'playing',
          createdAt: new Date().toISOString()
        }));
        
        setGameSessions(mockSessions);
      };

      // Initial data
      simulateWebSocketData();
      
      // Simulate periodic updates
      const interval = setInterval(simulateWebSocketData, 5000);
      
      return () => clearInterval(interval);
    };

    if (games.length > 0) {
      setupWebSocket();
    }
  }, [games]);

  // 🔹 Fetch recent activities (transactions and game history)
  useEffect(() => {
    const fetchRecentActivities = async () => {
      if (!user?._id) return;
      
      try {
        setLoadingActivities(true);
        
        // Fetch transactions
        const transactionsResponse = await api.get(`/transactions/user/${user._id}?limit=10&page=1`);
        const transactions: TransactionType[] = transactionsResponse.data.data || [];
        
        // Fetch game history
        const gameHistoryResponse = await api.get(`/game/history/user/${user._id}`);
        const gameHistory: GameHistoryType[] = gameHistoryResponse.data || [];
        
        // Combine and sort by date (newest first)
        const activities: RecentActivityType[] = [
          ...transactions.map((transaction): RecentActivityType => ({
            type: 'transaction',
            data: transaction,
            date: transaction.createdAt
          })),
          ...gameHistory.map((history): RecentActivityType => ({
            type: 'game_history',
            data: history,
            date: history.createdAt
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setRecentActivities(activities.slice(0, 5)); // Get top 5 most recent
      } catch (error) {
        console.error('Failed to load recent activities:', error);
      } finally {
        setLoadingActivities(false);
      }
    };

    if (user?._id) {
      fetchRecentActivities();
    }
  }, [user?._id]);

  // Get game status based on WebSocket sessions
  const getGameStatus = (betAmount: number) => {
    const sessionsForBet = gameSessions.filter(session => session.betAmount === betAmount);
    
    if (sessionsForBet.length === 0) {
      return {
        status: 'active' as const,
        playerCount: 0,
        prizePool: betAmount * 0.8
      };
    }

    const hasPlayingSession = sessionsForBet.some(session => session.status === 'playing');
    const activePlayers = sessionsForBet.filter(session => session.status === 'active').length;
    
    return {
      status: hasPlayingSession ? 'in-progress' as const : 'active' as const,
      playerCount: activePlayers,
      prizePool: activePlayers * betAmount * 0.8
    };
  };

  // Categorize games by status
  const activeGames = games.filter(game => 
    getGameStatus(game.betAmount).status === 'active'
  );
  
  const inProgressGames = games.filter(game => 
    getGameStatus(game.betAmount).status === 'in-progress'
  );

  if (!user) return null;

if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <MobileHeader title="Dashboard" />
        <div className="flex items-center justify-center h-screen w-full pt-16 pb-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  // Calculate wins from game history
  const wins = recentActivities.filter(activity => 
    activity.type === 'game_history'
  ).length;

  // Calculate total games played (transactions of type game_purchase)
  const totalGames = recentActivities.filter(activity => 
    activity.type === 'transaction' && 
    (activity.data as TransactionType).type === 'game_purchase'
  ).length;

  // Calculate win rate
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <MobileHeader title="Dashboard" />

      <main className="px-4 px-0 pb-24 pt-16 w-full max-w-full mx-auto overflow-x-hidden">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center w-full mb-6 pt-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-600">Ready to play some Bingo?</p>
        </motion.div>

        {/* Wallet Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="w-full mb-6"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg w-full">
            <h3 className="text-white text-xl font-bold mb-4">Your Wallet</h3>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="w-full">
                <p className="text-blue-100 text-sm">Balance</p>
                <p className="text-2xl font-bold truncate">{formatCurrency(user.wallet || 0)}</p>
              </div>
              <div className="w-full">
                <p className="text-blue-100 text-sm">Total Earnings</p>
                <p className="text-2xl font-bold truncate">{formatCurrency(user.totalEarnings || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
              <div className="w-full">
                <p className="text-blue-100 text-sm">Daily</p>
                <p className="text-lg font-semibold truncate">{formatCurrency(user.dailyEarnings || 0)}</p>
              </div>
              <div className="w-full">
                <p className="text-blue-100 text-sm">Weekly</p>
                <p className="text-lg font-semibold truncate">{formatCurrency(user.weeklyEarnings || 0)}</p>
              </div>
            </div>
            <button
              className="w-full mt-4 bg-white text-blue-600 hover:bg-gray-100 py-2 rounded-md font-medium flex items-center justify-center"
              onClick={() => router.push('/user/wallet')}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Funds
            </button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="grid grid-cols-3 gap-4 w-full mb-6"
        >
          <div className="bg-white p-4 rounded-lg text-center shadow-sm w-full">
            <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{wins}</p>
            <p className="text-xs text-gray-600">Wins</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center shadow-sm w-full">
            <Play className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{totalGames}</p>
            <p className="text-xs text-gray-600">Games</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center shadow-sm w-full">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{winRate}%</p>
            <p className="text-xs text-gray-600">Win Rate</p>
          </div>
        </motion.div>

        {/* Available Games - Single Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="w-full mb-6"
        >
          <div className="flex items-center justify-between mb-4 w-full">
            <h3 className="text-lg font-semibold text-gray-900">Available Games</h3>
            <span className="text-xs text-gray-600">
              Total: {games.length} • Active: {activeGames.length} • Playing: {inProgressGames.length}
            </span>
          </div>

          {loadingGames ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading games...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center w-full">
              <Clock className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Games Available</h4>
              <p className="text-gray-600 mb-4 text-sm">New games will be available soon. Check back later!</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-sm w-full">
              <div className="mb-4 w-full">
                <h4 className="font-semibold text-gray-900 mb-3">Active Games ({activeGames.length})</h4>
                {activeGames.length > 0 ? (
                  <div className="space-y-2 w-full">
                    {activeGames.map((game) => {
                      const status = getGameStatus(game.betAmount);
                      return (
                        <div key={game._id} className="flex items-center justify-between p-2 bg-blue-50 rounded w-full">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{formatCurrency(game.betAmount)} Bet</p>
                            <div className="flex items-center text-xs text-gray-600 mt-1">
                              <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{status.playerCount} players • Prize: {formatCurrency(status.prizePool)}</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex-shrink-0 ml-2">Active</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No active games at the moment</p>
                )}
              </div>

              <div className="mb-4 w-full">
                <h4 className="font-semibold text-gray-900 mb-3">In Progress ({inProgressGames.length})</h4>
                {inProgressGames.length > 0 ? (
                  <div className="space-y-2 w-full">
                    {inProgressGames.map((game) => {
                      const status = getGameStatus(game.betAmount);
                      return (
                        <div key={game._id} className="flex items-center justify-between p-2 bg-yellow-50 rounded w-full">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{formatCurrency(game.betAmount)} Bet</p>
                            <div className="flex items-center text-xs text-gray-600 mt-1">
                              <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{status.playerCount} players • Prize: {formatCurrency(status.prizePool)}</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex-shrink-0 ml-2">Playing</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No games in progress</p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-center w-full">
                <p className="text-sm text-green-600 mb-3">Win 80% of the prize pool!</p>
                <button 
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium w-full" 
                  onClick={() => router.push('/user/lobby')}
                >
                  Join Game
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="w-full mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          
          {loadingActivities ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center w-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading activities...</p>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm text-center w-full">
              <Clock className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h4>
              <p className="text-gray-600 text-sm">Start playing games to see your activity here</p>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-sm w-full">
              <div className="space-y-3 w-full">
                {recentActivities.map((activity) => (
                  <div key={activity.type + activity.data._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 w-full">
                    {activity.type === 'transaction' ? (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium capitalize truncate">{(activity.data as TransactionType).type.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600 truncate">{(activity.data as TransactionType).description}</p>
                          <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleDateString()}</p>
                        </div>
                        <div className={`text-right flex-shrink-0 ml-2 ${(activity.data as TransactionType).type === 'deposit' || (activity.data as TransactionType).type === 'winning' ? 'text-green-600' : 'text-red-600'}`}>
                          <p className="font-semibold truncate">{(activity.data as TransactionType).type === 'deposit' || (activity.data as TransactionType).type === 'winning' ? '+' : '-'}{formatCurrency((activity.data as TransactionType).amount)}</p>
                          <p className={`text-xs capitalize ${(activity.data as TransactionType).status === 'completed' ? 'text-green-500' : (activity.data as TransactionType).status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                            {(activity.data as TransactionType).status}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">Game Win!</p>
                          <p className="text-sm text-gray-600 truncate">Card #{((activity.data as GameHistoryType).winnerCard)} • {((activity.data as GameHistoryType).numberOfPlayers)} players</p>
                          <p className="text-xs text-gray-400">{new Date(activity.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right text-green-600 flex-shrink-0 ml-2">
                          <p className="font-semibold truncate">+{formatCurrency((activity.data as GameHistoryType).prizePool)}</p>
                          <p className="text-xs text-green-500">Won</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />

      <MobileNavigation />
    </div>
  );
}