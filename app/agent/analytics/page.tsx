'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, useTheme, useMediaQuery, IconButton
} from '@mui/material';
import {
  ChevronLeft, ChevronRight,
  AccountBalance, TrendingUp, TrendingDown, CheckCircle, 
  PendingActions, Cancel, AccountBalanceWallet, Payment
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import api from '@/app/utils/api';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
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
    totalRevenue: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const STATUS_COLORS = {
  completed: '#4CAF50',
  pending: '#FF9800',
  failed: '#F44336'
};

const METHOD_COLORS = {
  telebirr: '#2196F3',
  cbe: '#4CAF50',
  other: '#FF9800'
};

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
      
      const totalRevenue = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => {
          if (t.type === 'game_purchase') return sum + t.amount;
          if (t.type === 'deposit') return sum + (t.amount * 0.02);
          return sum;
        }, 0);

      const analyticsData: AnalyticsData = {
        transactions: transactions,
        stats: {
          totalDeposits,
          totalWithdrawals,
          netBalance: totalDeposits - totalWithdrawals,
          totalCompleted,
          totalPending,
          totalFailed,
          totalRevenue
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

  const getWeeklyRevenueData = () => {
    if (!data) return [];
    const weekDates = getWeekDates();
    const result = weekDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      deposit: 0,
      withdrawal: 0,
      revenue: 0,
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
          } else if (transaction.type === 'game_purchase') {
            result[dayIndex].revenue += transaction.amount;
          }
        }
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

  const getTransactionMethodData = () => {
    if (!data) return [];
    const methodCount = data.transactions.reduce((acc: any, transaction) => {
      const method = transaction.reference || 'other';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(methodCount).map(([method, count]) => ({
      name: method.toUpperCase(),
      value: count
    }));
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

  const weeklyRevenueData = getWeeklyRevenueData();
  const transactionStatusData = getTransactionStatusData();
  const transactionMethodData = getTransactionMethodData();

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: { xs: 2, sm: 3 } 
    }}>
      {/* Header */}
      <Box>
        <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>Transaction Analytics</Typography>
        <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">Comprehensive transaction insights and performance metrics</Typography>
      </Box>

      {/* Summary Stats - Responsive Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
        gap: { xs: 1.5, sm: 2 },
        mb: 2 
      }}>
        {[
          { 
            icon: <AccountBalance sx={{ fontSize: isMobile ? 24 : 30 }} />, 
            value: formatCurrency(data.stats.totalDeposits), 
            label: 'Total Deposits', 
            change: '+12%', 
            color: '#2196F3',
            trend: 'up'
          },
          { 
            icon: <AccountBalanceWallet sx={{ fontSize: isMobile ? 24 : 30 }} />, 
            value: formatCurrency(data.stats.totalWithdrawals), 
            label: 'Total Withdrawals', 
            change: '+8%', 
            color: '#9C27B0',
            trend: 'up'
          },
          { 
            icon: <TrendingUp sx={{ fontSize: isMobile ? 24 : 30 }} />, 
            value: formatCurrency(data.stats.netBalance), 
            label: 'Net Balance', 
            change: data.stats.netBalance >= 0 ? '+20%' : '-5%', 
            color: data.stats.netBalance >= 0 ? '#4CAF50' : '#F44336',
            trend: data.stats.netBalance >= 0 ? 'up' : 'down'
          },
          { 
            icon: <CheckCircle sx={{ fontSize: isMobile ? 24 : 30 }} />, 
            value: data.stats.totalCompleted.toString(), 
            label: 'Completed', 
            change: '+15%', 
            color: '#4CAF50',
            trend: 'up'
          },
          { 
            icon: <PendingActions sx={{ fontSize: isMobile ? 24 : 30 }} />, 
            value: data.stats.totalPending.toString(), 
            label: 'Pending', 
            change: '+3%', 
            color: '#FF9800',
            trend: 'up'
          },
          { 
            icon: <Cancel sx={{ fontSize: isMobile ? 24 : 30 }} />, 
            value: data.stats.totalFailed.toString(), 
            label: 'Failed', 
            change: '-2%', 
            color: '#F44336',
            trend: 'down'
          }
        ].map((stat, index) => (
          <Card key={index} sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            background: `linear-gradient(145deg, ${stat.color}, ${stat.color}99)`, 
            color: 'white', 
            borderRadius: 2, 
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: isMobile ? '100px' : '120px'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 'bold', mb: 0.5, fontSize: isMobile ? '0.9rem' : 'inherit' }}>
                  {stat.value}
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} sx={{ opacity: 0.9, fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                  {stat.label}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {stat.icon}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  {stat.trend === 'up' ? 
                    <TrendingUp sx={{ fontSize: isMobile ? 14 : 16, mr: 0.5 }} /> : 
                    <TrendingDown sx={{ fontSize: isMobile ? 14 : 16, mr: 0.5 }} />
                  }
                  <Typography variant="caption" sx={{ opacity: 0.8, fontSize: isMobile ? '0.6rem' : '0.7rem' }}>
                    {stat.change}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Revenue Chart */}
      <Card sx={{ 
        p: { xs: 2, sm: 3 }, 
        borderRadius: 2, 
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)' 
      }}>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', mb: 3, gap: isMobile ? 1 : 0 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"}>Weekly Revenue & Transactions</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigateWeek('prev')} size="small"><ChevronLeft /></IconButton>
            <Typography variant="body2" sx={{ mx: 1, fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
              {getWeekRangeText()}
            </Typography>
            <IconButton onClick={() => navigateWeek('next')} size="small" disabled={currentWeekOffset === 0}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ height: isMobile ? 250 : 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={isMobile ? 10 : 12} />
              <YAxis yAxisId="left" fontSize={isMobile ? 10 : 12} />
              <YAxis yAxisId="right" orientation="right" fontSize={isMobile ? 10 : 12} />
              <Tooltip
                formatter={(value, name) => {
                  const label = String(name);
                  const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);

                  if (['revenue', 'deposit', 'withdrawal', 'netBalance'].includes(label)) {
                    return [formatCurrency(Number(value)), formattedLabel];
                  }
                  return [value, formattedLabel];
                }}
              />
              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12, paddingTop: isMobile ? 10 : 20 }} />
              <Bar yAxisId="left" dataKey="deposit" fill="#2196F3" name="Deposit" />
              <Bar yAxisId="left" dataKey="withdrawal" fill="#9C27B0" name="Withdrawal" />
              <Bar yAxisId="left" dataKey="revenue" fill="#4CAF50" name="Revenue" />
              <Line yAxisId="right" type="monotone" dataKey="netBalance" stroke="#FF9800" name="Net Balance" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* Status and Method Charts - Responsive Layout */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        gap: { xs: 2, sm: 3 } 
      }}>
        {/* Status Chart */}
        <Card sx={{ 
          flex: 1, 
          p: { xs: 2, sm: 3 }, 
          borderRadius: 2, 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Payment sx={{ mr: 1, fontSize: isMobile ? '1rem' : '1.25rem' }} /> Transaction Status
          </Typography>
          <Box sx={{ height: isMobile ? 200 : 300, mt: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 60 : 100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    isMobile ? `${name}` : `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={!isMobile}
                >
                  {transactionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase() as keyof typeof STATUS_COLORS]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Transactions']} />
                {!isMobile && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Method Chart */}
        <Card sx={{ 
          flex: 1, 
          p: { xs: 2, sm: 3 }, 
          borderRadius: 2, 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <AccountBalance sx={{ mr: 1, fontSize: isMobile ? '1rem' : '1.25rem' }} /> Payment Methods
          </Typography>
          <Box sx={{ height: isMobile ? 200 : 300, mt: 'auto' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionMethodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 60 : 100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    isMobile ? `${name}` : `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={!isMobile}
                >
                  {transactionMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      METHOD_COLORS[entry.name.toLowerCase() as keyof typeof METHOD_COLORS] || METHOD_COLORS.other
                    } />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Transactions']} />
                {!isMobile && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}