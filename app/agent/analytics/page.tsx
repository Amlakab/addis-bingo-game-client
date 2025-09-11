'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, useTheme, useMediaQuery, IconButton
} from '@mui/material';
import {
  ChevronLeft, ChevronRight,
  AccountBalance, TrendingUp, TrendingDown, CheckCircle, 
  PendingActions, Cancel, AccountBalanceWallet
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import api from '@/app/utils/api';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

interface AnalyticsData {
  transactions: Transaction[];
  stats: {
    totalDeposits: number;
    totalWithdrawals: number;
    netBalance: number;
    totalCompleted: number;
    totalPending: number;
    totalFailed: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const STATUS_COLORS = {
  completed: '#4CAF50',
  pending: '#FF9800',
  failed: '#F44336'
};

export default function AnalyticsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      const transactionsRes = await api.get('/transactions');

      const transactions: Transaction[] = transactionsRes.data.data;
      
      // Calculate stats
      const totalDeposits = transactions
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalWithdrawals = transactions
        .filter(t => t.type === 'withdrawal' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const totalCompleted = transactions.filter(t => t.status === 'completed').length;
      const totalPending = transactions.filter(t => t.status === 'pending').length;
      const totalFailed = transactions.filter(t => t.status === 'failed').length;

      const analyticsData: AnalyticsData = {
        transactions: transactions,
        stats: {
          totalDeposits,
          totalWithdrawals,
          netBalance: totalDeposits - totalWithdrawals,
          totalCompleted,
          totalPending,
          totalFailed
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

  const getWeeklyTransactionData = () => {
    if (!data) return [];
    const weekDates = getWeekDates();
    const result = weekDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      completed: 0,
      pending: 0,
      failed: 0
    }));

    data.transactions.forEach(transaction => {
      const transDate = new Date(transaction.createdAt).toISOString().split('T')[0];
      const dayIndex = weekDates.indexOf(transDate);
      if (dayIndex !== -1) {
        result[dayIndex][transaction.status] += 1;
      }
    });

    return result;
  };

  const getTransactionStatusData = () => {
    if (!data) return [];
    return [
      { name: 'Completed', value: data.stats.totalCompleted },
      { name: 'Pending', value: data.stats.totalPending },
      { name: 'Failed', value: data.stats.totalFailed }
    ];
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
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
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

  const weeklyTransactionData = getWeeklyTransactionData();
  const transactionStatusData = getTransactionStatusData();

  return (
    <div>
    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>Transaction Analytics</Typography>
        <Typography variant="body1" color="text.secondary">Comprehensive transaction insights and performance metrics</Typography>
      </Box>

      {/* Summary Stats - 6 Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
        gap: 2,
        mb: 2 
      }}>
        {[
          { 
            icon: <AccountBalance sx={{ fontSize: 30 }} />, 
            value: formatCurrency(data.stats.totalDeposits), 
            label: 'Total Deposits', 
            change: '+12%', 
            color: '#2196F3',
            trend: 'up'
          },
          { 
            icon: <AccountBalanceWallet sx={{ fontSize: 30 }} />, 
            value: formatCurrency(data.stats.totalWithdrawals), 
            label: 'Total Withdrawals', 
            change: '+8%', 
            color: '#9C27B0',
            trend: 'up'
          },
          { 
            icon: <TrendingUp sx={{ fontSize: 30 }} />, 
            value: formatCurrency(data.stats.netBalance), 
            label: 'Net Balance', 
            change: data.stats.netBalance >= 0 ? '+20%' : '-5%', 
            color: data.stats.netBalance >= 0 ? '#4CAF50' : '#F44336',
            trend: data.stats.netBalance >= 0 ? 'up' : 'down'
          },
          { 
            icon: <CheckCircle sx={{ fontSize: 30 }} />, 
            value: data.stats.totalCompleted, 
            label: 'Completed', 
            change: '+15%', 
            color: '#4CAF50',
            trend: 'up'
          },
          { 
            icon: <PendingActions sx={{ fontSize: 30 }} />, 
            value: data.stats.totalPending, 
            label: 'Pending', 
            change: '+3%', 
            color: '#FF9800',
            trend: 'up'
          },
          { 
            icon: <Cancel sx={{ fontSize: 30 }} />, 
            value: data.stats.totalFailed, 
            label: 'Failed', 
            change: '-2%', 
            color: '#F44336',
            trend: 'down'
          }
        ].map((stat, index) => (
          <Card key={index} sx={{ 
            p: 2, 
            background: `linear-gradient(145deg, ${stat.color}, ${stat.color}99)`, 
            color: 'white', 
            borderRadius: 2, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '120px'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>{stat.value}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>{stat.label}</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {stat.icon}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  {stat.trend === 'up' ? 
                    <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} /> : 
                    <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />
                  }
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                    {stat.change}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Transaction Status Chart - Full Width */}
      <Card sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Transaction Status Distribution</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigateWeek('prev')} size="small"><ChevronLeft /></IconButton>
            <Typography variant="body2" sx={{ mx: 1, fontSize: '0.8rem' }}>{getWeekRangeText()}</Typography>
            <IconButton onClick={() => navigateWeek('next')} size="small" disabled={currentWeekOffset === 0}><ChevronRight /></IconButton>
          </Box>
        </Box>
        <Box sx={{ height: isMobile ? 250 : 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyTransactionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill={STATUS_COLORS.completed} name="Completed" />
              <Bar dataKey="pending" fill={STATUS_COLORS.pending} name="Pending" />
              <Bar dataKey="failed" fill={STATUS_COLORS.failed} name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* Transaction Status Pie Chart */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
        <Card sx={{ 
          flex: 1, 
          p: 3, 
          borderRadius: 2, 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Transaction Status Overview</Typography>
          <Box sx={{ height: isMobile ? 250 : 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 80 : 100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {transactionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase() as keyof typeof STATUS_COLORS]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Transactions']} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Card>
      </Box>
    </Box>
    </div>
  );
}