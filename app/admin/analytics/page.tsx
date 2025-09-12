'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, useTheme, useMediaQuery, IconButton
} from '@mui/material';
import {
  ChevronLeft, ChevronRight,
  AccountBalance, People, Casino, Payment, EmojiEvents
} from '@mui/icons-material';
import {
  ComposedChart, BarChart, PieChart,
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Pie
} from 'recharts';
import api from '@/app/utils/api';

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
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface GameHistory {
  _id: string;
  winnerId: { phone: string };
  winnerCard: number;
  prizePool: number;
  numberOfPlayers: number;
  betAmount: number;
  createdAt: string;
}

interface AnalyticsData {
  users: User[];
  transactions: Transaction[];
  gameHistory: GameHistory[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalRevenue: number;
    totalGames: number;
    averagePrizePool: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [usersRes, transactionsRes, gamesRes] = await Promise.all([
        api.get('/user'),
        api.get('/transactions'),
        api.get('/game/history')
      ]);

      const analyticsData: AnalyticsData = {
        users: usersRes.data.data.users,
        transactions: transactionsRes.data.data,
        gameHistory: gamesRes.data,
        stats: {
          totalUsers: usersRes.data.data.users.length,
          activeUsers: usersRes.data.data.users.filter((u: User) => u.isActive).length,
          totalTransactions: transactionsRes.data.data.length,
          totalRevenue: calculateTotalRevenue(transactionsRes.data.data),
          totalGames: gamesRes.data.length,
          averagePrizePool: calculateAveragePrizePool(gamesRes.data)
        }
      };

      setData(analyticsData);
      setError('');
    } catch (error: any) {
      setError('Failed to fetch analytics data');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalRevenue = (transactions: Transaction[]): number => {
    return transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => {
        if (t.type === 'game_purchase') return sum + t.amount;
        if (t.type === 'deposit') return sum + (t.amount * 0.02);
        return sum;
      }, 0);
  };

  const calculateAveragePrizePool = (games: GameHistory[]): number => {
    if (games.length === 0) return 0;
    return games.reduce((sum, game) => sum + game.prizePool, 0) / games.length;
  };

  const getWeekDates = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() - (currentWeekOffset * 7));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getWeeklyGamesData = () => {
    if (!data) return [];
    const weekDates = getWeekDates();
    const result = weekDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      games: 0,
      prizePool: 0,
      earnings: 0
    }));

    data.gameHistory.forEach(game => {
      const gameDate = new Date(game.createdAt).toISOString().split('T')[0];
      const dayIndex = weekDates.indexOf(gameDate);
      if (dayIndex !== -1) {
        result[dayIndex].games++;
        result[dayIndex].prizePool += game.prizePool;
        result[dayIndex].earnings += (game.betAmount * game.numberOfPlayers) - game.prizePool;
      }
    });

    return result;
  };

  const getWeeklyRevenueData = () => {
    if (!data) return [];
    const weekDates = getWeekDates();
    const result = weekDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      deposit: 0,
      withdrawal: 0,
      netBalance: 0
    }));

    data.transactions.forEach(transaction => {
      if (transaction.status === 'completed') {
        const transDate = new Date(transaction.createdAt).toISOString().split('T')[0];
        const dayIndex = weekDates.indexOf(transDate);
        if (dayIndex !== -1) {
          if (transaction.type === 'deposit') {
            result[dayIndex].deposit += transaction.amount;
            result[dayIndex].netBalance += transaction.amount;
          } else if (transaction.type === 'withdrawal') {
            result[dayIndex].withdrawal += transaction.amount;
            result[dayIndex].netBalance -= transaction.amount;
          }
        }
      }
    });

    return result;
  };

  const getUsersByStatusData = () => {
    if (!data) return [];
    const activeUsers = data.users.filter(user => user.isActive).length;
    const inactiveUsers = data.users.length - activeUsers;
    return [
      { name: 'Active', value: activeUsers },
      { name: 'Inactive', value: inactiveUsers }
    ];
  };

  const getTransactionTypeData = () => {
    if (!data) return [];
    const typeCount = data.transactions.reduce((acc: any, transaction) => {
      acc[transaction.type] = (acc[transaction.type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(typeCount).map(([type, count]) => ({
      name: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      value: count
    }));
  };

  const getUserTypeData = () => {
    if (!data) return [];
    const roleCount = data.users.reduce((acc: any, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(roleCount).map(([role, count]) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: count
    }));
  };

  const getBetCountData = () => {
    if (!data) return [];
    const betCounts: { [key: number]: number } = {};
    data.gameHistory.forEach(game => {
      betCounts[game.betAmount] = (betCounts[game.betAmount] || 0) + 1;
    });
    return Object.entries(betCounts)
      .map(([betAmount, count]) => ({ name: `${betAmount}`, value: count }))
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekOffset(prev => direction === 'prev' ? prev + 1 : prev - 1);
  };

  const getWeekRangeText = () => {
    const weekDates = getWeekDates();
    const startDate = new Date(weekDates[0]);
    const endDate = new Date(weekDates[6]);
    return isMobile 
      ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">Loading Analytics...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No data available</Typography>
      </Box>
    );
  }

  const weeklyGamesData = getWeeklyGamesData();
  const weeklyRevenueData = getWeeklyRevenueData();
  const usersByStatusData = getUsersByStatusData();
  const transactionTypeData = getTransactionTypeData();
  const userTypeData = getUserTypeData();
  const betCountData = getBetCountData();

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box>
        <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>Analytics Dashboard</Typography>
        <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">Comprehensive insights and performance metrics</Typography>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)' 
        }, 
        gap: 2, 
        mb: 2 
      }}>
        {[
          { icon: <People sx={{ fontSize: { xs: 24, sm: 30 } }} />, value: data.stats.totalUsers, label: 'Total Users', change: '+12%', color: '#2196F3' },
          { icon: <Payment sx={{ fontSize: { xs: 24, sm: 30 } }} />, value: data.stats.totalTransactions, label: 'Transactions', change: '+8%', color: '#4CAF50' },
          { icon: <Casino sx={{ fontSize: { xs: 24, sm: 30 } }} />, value: data.stats.totalGames, label: 'Games Played', change: '+15%', color: '#FF9800' },
          { icon: <AccountBalance sx={{ fontSize: { xs: 24, sm: 30 } }} />, value: formatCurrency(data.stats.totalRevenue), label: 'Total Revenue', change: '+20%', color: '#9C27B0' }
        ].map((stat, index) => (
          <Card key={index} sx={{ 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            background: `linear-gradient(145deg, ${stat.color}, ${stat.color}99)`, 
            color: 'white', 
            borderRadius: 2, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', mb: 0.5 }}>{stat.value}</Typography>
                <Typography variant={isMobile ? "caption" : "body2"} sx={{ opacity: 0.9 }}>{stat.label}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>{stat.change} from last period</Typography>
              </Box>
              {stat.icon}
            </Box>
          </Card>
        ))}
      </Box>

      {/* Charts Container */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {/* First Row: Revenue + Transaction Type */}
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, flex: 1 }}>
          <Card sx={{ 
            flex: 3, 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            borderRadius: 2, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} /> Weekly Revenue
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => navigateWeek('prev')} size="small"><ChevronLeft /></IconButton>
                <Typography variant="caption" sx={{ mx: 0.5, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>{getWeekRangeText()}</Typography>
                <IconButton onClick={() => navigateWeek('next')} size="small" disabled={currentWeekOffset === 0}><ChevronRight /></IconButton>
              </Box>
            </Box>
            <Box sx={{ height: isMobile ? 250 : 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={isMobile ? 10 : 12} />
                  <YAxis fontSize={isMobile ? 10 : 12} />
                  <Tooltip 
                    formatter={(value, name) => name === 'netBalance' ? [formatCurrency(Number(value)), 'Net Balance'] : [formatCurrency(Number(value)), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                  <Bar dataKey="deposit" fill="#4CAF50" name="Deposit" />
                  <Bar dataKey="withdrawal" fill="#F44336" name="Withdrawal" />
                  <Line type="monotone" dataKey="netBalance" stroke="#2196F3" name="Net Balance" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          <Card sx={{ 
            flex: 1, 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            borderRadius: 2, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Payment sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} /> Transaction Types
            </Typography>
            <Box sx={{ height: isMobile ? 200 : 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      isMobile ? `${name}` : `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={!isMobile}
                  >
                    {transactionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Transactions']} />
                  {!isMobile && <Legend />}
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>

        {/* Second Row: Games + Bet Count */}
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, flex: 1 }}>
          <Card sx={{ 
            flex: 3, 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            borderRadius: 2, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ display: 'flex', alignItems: 'center' }}>
                <Casino sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} /> Weekly Games
              </Typography>
              <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>{getWeekRangeText()}</Typography>
            </Box>
            <Box sx={{ height: isMobile ? 250 : 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyGamesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={isMobile ? 10 : 12} />
                  <YAxis yAxisId="left" fontSize={isMobile ? 10 : 12} />
                  <YAxis yAxisId="right" orientation="right" fontSize={isMobile ? 10 : 12} />
                  <Tooltip 
                    formatter={(value, name) => name === 'games' ? [value, 'Games'] : name === 'prizePool' ? [formatCurrency(Number(value)), 'Prize Pool'] : [formatCurrency(Number(value)), 'Earnings']}
                  />
                  <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
                  <Bar yAxisId="left" dataKey="games" fill="#8884d8" name="Games" />
                  <Bar yAxisId="left" dataKey="prizePool" fill="#82ca9d" name="Prize Pool" />
                  <Line yAxisId="right" type="monotone" dataKey="earnings" stroke="#ff7300" name="Earnings" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          <Card sx={{ 
            flex: 1, 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            borderRadius: 2, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
            display: 'flex', 
            flexDirection: 'column' 
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <EmojiEvents sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} /> Bet Count
            </Typography>
            <Box sx={{ height: isMobile ? 200 : 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={betCountData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={isMobile ? 10 : 12} />
                  <YAxis type="category" dataKey="name" fontSize={isMobile ? 10 : 12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>

        {/* Third Row: Users by Status + User Types */}
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, flex: 1 }}>
          <Card sx={{ 
            flex: 1, 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            borderRadius: 2, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)' 
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2 }}>Users by Status</Typography>
            <Box sx={{ height: isMobile ? 200 : 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usersByStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={isMobile ? 10 : 12} />
                  <YAxis fontSize={isMobile ? 10 : 12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          <Card sx={{ 
            flex: 1, 
            p: { xs: 1.5, sm: 2, md: 3 }, 
            borderRadius: 2, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)' 
          }}>
            <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2 }}>User Types</Typography>
            <Box sx={{ height: isMobile ? 200 : 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={isMobile ? 60 : 80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      isMobile ? `${name}` : `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={!isMobile}
                  >
                    {userTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  {!isMobile && <Legend />}
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}