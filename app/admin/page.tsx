// app/admin/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { 
  Users, Gamepad2, DollarSign, BarChart3, 
  TrendingUp, TrendingDown, ArrowUp, ArrowDown,
  ArrowRight, Smartphone, Calendar, Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import api from '@/app/utils/api';

// Interface definitions
interface User {
  _id: string;
  phone: string;
  role: 'user' | 'agent' | 'admin';
  wallet: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: string;
}

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    phone: string;
  };
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  description: string;
  createdAt: string;
}

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
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  totalGames: number;
  todayEarnings: number;
  userGrowth: number;
  revenueGrowth: number;
  gameGrowth: number;
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [usersRes, transactionsRes, gamesRes, gameHistoryRes] = await Promise.all([
        api.get('/user'),
        api.get('/transactions?limit=100'), // Get more to filter for recent
        api.get('/games'),
        api.get('/game/history')
      ]);

      const users: User[] = usersRes.data.data.users;
      const allTransactions: Transaction[] = transactionsRes.data.data;
      const games = gamesRes.data.data;
      const allGameHistory: GameHistory[] = gameHistoryRes.data;
      
      // Calculate stats
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.isActive).length;
      const totalTransactions = allTransactions.length;
      const totalGames = games.length;
      
      // Calculate total revenue (from game purchases and deposit fees)
      const totalRevenue = allTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => {
          if (t.type === 'game_purchase') return sum + t.amount;
          if (t.type === 'deposit') return sum + (t.amount * 0.02); // 2% fee
          return sum;
        }, 0);

      // Calculate today's earnings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEarnings = allTransactions
        .filter(t => t.status === 'completed' && new Date(t.createdAt) >= today)
        .reduce((sum, t) => {
          if (t.type === 'game_purchase') return sum + t.amount;
          if (t.type === 'deposit') return sum + (t.amount * 0.02);
          return sum;
        }, 0);

      // Get 5 most recent transactions
      const recentTransactions = [...allTransactions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Get 5 most recent game history
      const recentGameHistory = [...allGameHistory]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Prepare recent activities from both recent transactions and game history
      const activities = [
        ...recentTransactions.map(t => ({
          id: t._id,
          type: 'transaction',
          user: t.userId?.phone || 'Unknown',
          action: t.type,
          amount: t.amount,
          time: new Date(t.createdAt),
          formattedTime: formatTimeDifference(new Date(t.createdAt))
        })),
        ...recentGameHistory.map(g => ({
          id: g._id,
          type: 'game',
          user: g.winnerId?.phone || 'Unknown',
          action: 'won_game',
          amount: g.prizePool,
          time: new Date(g.createdAt),
          formattedTime: formatTimeDifference(new Date(g.createdAt))
        }))
      ]
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 5);

      setStatsData({
        totalUsers,
        activeUsers,
        totalTransactions,
        totalRevenue,
        totalGames,
        todayEarnings,
        userGrowth: calculateGrowth(users.length, 1000), // Example calculation
        revenueGrowth: calculateGrowth(totalRevenue, 10000),
        gameGrowth: calculateGrowth(totalGames, 50)
      });

      setRecentActivities(activities);
      setError('');
    } catch (error: any) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate growth percentage
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  };

  // Helper function to format time difference
  const formatTimeDifference = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'deposit': return 'deposited';
      case 'withdrawal': return 'withdrew';
      case 'game_purchase': return 'played game';
      case 'winning': return 'won';
      case 'won_game': return 'won game';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'deposit':
      case 'winning':
      case 'won_game':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getActionSymbol = (action: string) => {
    switch (action) {
      case 'deposit':
      case 'winning':
      case 'won_game':
        return '+';
      case 'withdrawal':
        return '-';
      default:
        return '';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return <div className="text-center py-8 text-red-600">Access denied. Admin only.</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!statsData) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Total Users Card */}
        <Link href="/admin/users">
          <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-blue-100 rounded-full mr-3 md:mr-4">
                  <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total Users</p>
                  <p className="text-xl md:text-2xl font-bold">{statsData.totalUsers}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            </div>
            <div className="mt-3 md:mt-4 flex items-center text-xs md:text-sm">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+{statsData.userGrowth}%</span>
              <span className="text-gray-500 ml-1 md:ml-2">from last week</span>
            </div>
          </div>
        </Link>
        
        {/* Total Games Card */}
        <Link href="/admin/games">
          <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-green-100 rounded-full mr-3 md:mr-4">
                  <Gamepad2 className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total Games</p>
                  <p className="text-xl md:text-2xl font-bold">{statsData.totalGames}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            </div>
            <div className="mt-3 md:mt-4 flex items-center text-xs md:text-sm">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+{statsData.gameGrowth}%</span>
              <span className="text-gray-500 ml-1 md:ml-2">from yesterday</span>
            </div>
          </div>
        </Link>
        
        {/* Total Revenue Card */}
        <Link href="/admin/transactions">
          <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-purple-100 rounded-full mr-3 md:mr-4">
                  <DollarSign className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total Revenue</p>
                  <p className="text-xl md:text-2xl font-bold">{formatCurrency(statsData.totalRevenue)}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            </div>
            <div className="mt-3 md:mt-4 flex items-center text-xs md:text-sm">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+{statsData.revenueGrowth}%</span>
              <span className="text-gray-500 ml-1 md:ml-2">from last month</span>
            </div>
          </div>
        </Link>
        
        {/* Today's Earnings Card */}
        <Link href="/admin/game-history">
          <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-yellow-100 rounded-full mr-3 md:mr-4">
                  <BarChart3 className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Today's Earnings</p>
                  <p className="text-xl md:text-2xl font-bold">{formatCurrency(statsData.todayEarnings)}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            </div>
            <div className="mt-3 md:mt-4 flex items-center text-xs md:text-sm">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+15%</span>
              <span className="text-gray-500 ml-1 md:ml-2">from yesterday</span>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Recent Activities */}
      <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold">Recent Activities</h2>
          <Link href="/admin/activities" className="text-blue-600 hover:text-blue-800 text-xs md:text-sm">
            View all activities
          </Link>
        </div>
        
        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-sm">
                  {activity.user}
                </div>
                <span className="text-xs text-gray-500">
                  {activity.formattedTime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">
                  {getActionLabel(activity.action)}
                </span>
                {activity.amount ? (
                  <span className={getActionColor(activity.action) + " text-sm font-medium"}>
                    {getActionSymbol(activity.action)}{formatCurrency(activity.amount)}
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activity.user}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                    {getActionLabel(activity.action)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {activity.amount ? (
                      <span className={getActionColor(activity.action)}>
                        {getActionSymbol(activity.action)}{formatCurrency(activity.amount)}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {activity.formattedTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}