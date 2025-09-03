'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  Chip, Alert, Snackbar, CircularProgress,
  useTheme, useMediaQuery, Pagination,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AccountBalance, ArrowUpward, ArrowDownward,
  Casino, EmojiEvents, Search, FilterList,
  TrendingUp, AccountBalanceWallet, Payment
} from '@mui/icons-material';
import api from '@/app/utils/api';

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    phone: string;
    name?: string;
  };
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  description: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWinnings: number;
  totalGamePurchases: number;
  netBalance: number;
  recentTransactions: Transaction[];
}

interface PaginationData {
  current: number;
  total: number;
  count: number;
  totalRecords: number;
}

export default function TransactionsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await api.get(`/transactions?${params}`);
      setTransactions(response.data.data);
      setPagination(response.data.pagination);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/transactions/stats/overview');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : prev.page // Reset to first page when filters change
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    handleFilterChange('page', value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownward sx={{ color: 'success.main' }} />;
      case 'withdrawal': return <ArrowUpward sx={{ color: 'error.main' }} />;
      case 'game_purchase': return <Casino sx={{ color: 'warning.main' }} />;
      case 'winning': return <EmojiEvents sx={{ color: 'success.main' }} />;
      default: return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'success';
      case 'withdrawal': return 'error';
      case 'game_purchase': return 'warning';
      case 'winning': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Calculate totals from transactions data
  const calculateTotals = () => {
    if (!transactions.length) return { totalDeposits: 0, totalWithdrawals: 0, netBalance: 0 };
    
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netBalance = totalDeposits - totalWithdrawals;
    
    return { totalDeposits, totalWithdrawals, netBalance };
  };

  const { totalDeposits, totalWithdrawals, netBalance } = calculateTotals();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
            Transaction History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track all your financial activities and game transactions
          </Typography>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
          }}
        >
          {/* Net Balance Card */}
          <Box
            sx={{
              flex: { xs: "1 1 100%", sm: "1 1 48%", md: "1 1 23%" },
              display: "flex",
            }}
          >
            <Card
              sx={{
                flex: 1,
                background: "linear-gradient(145deg, #2196F3, #21CBF3)",
                color: "white",
                borderRadius: 3,
                boxShadow: "0 8px 16px rgba(33, 150, 243, 0.3)",
                minHeight: { xs: "120px", sm: "140px" },
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <AccountBalanceWallet sx={{ fontSize: { xs: 20, sm: 24 }, mr: 1 }} />
                  <Typography
                    variant={isMobile ? "body2" : "body1"}
                    sx={{ fontWeight: "medium" }}
                  >
                    Net Balance
                  </Typography>
                </Box>
                <Typography
                  variant={isMobile ? "h6" : "h5"}
                  sx={{
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    color: netBalance >= 0 ? "inherit" : "#ff6b6b",
                  }}
                >
                  {formatCurrency(netBalance)}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Total Deposits Card */}
          <Box
            sx={{
              flex: { xs: "1 1 100%", sm: "1 1 48%", md: "1 1 23%" },
              display: "flex",
            }}
          >
            <Card
              sx={{
                flex: 1,
                background: "linear-gradient(145deg, #4CAF50, #8BC34A)",
                color: "white",
                borderRadius: 3,
                boxShadow: "0 8px 16px rgba(76, 175, 80, 0.3)",
                minHeight: { xs: "120px", sm: "140px" },
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <ArrowDownward sx={{ fontSize: { xs: 20, sm: 24 }, mr: 1 }} />
                  <Typography
                    variant={isMobile ? "body2" : "body1"}
                    sx={{ fontWeight: "medium" }}
                  >
                    Total Deposits
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: "bold" }}>
                  {formatCurrency(totalDeposits)}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Total Withdrawals Card */}
          <Box
            sx={{
              flex: { xs: "1 1 100%", sm: "1 1 48%", md: "1 1 23%" },
              display: "flex",
            }}
          >
            <Card
              sx={{
                flex: 1,
                background: "linear-gradient(145deg, #F44336, #FF5722)",
                color: "white",
                borderRadius: 3,
                boxShadow: "0 8px 16px rgba(244, 67, 54, 0.3)",
                minHeight: { xs: "120px", sm: "140px" },
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <ArrowUpward sx={{ fontSize: { xs: 20, sm: 24 }, mr: 1 }} />
                  <Typography
                    variant={isMobile ? "body2" : "body1"}
                    sx={{ fontWeight: "medium" }}
                  >
                    Total Withdrawals
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: "bold" }}>
                  {formatCurrency(totalWithdrawals)}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Total Transactions Card */}
          <Box
            sx={{
              flex: { xs: "1 1 100%", sm: "1 1 48%", md: "1 1 23%" },
              display: "flex",
            }}
          >
            <Card
              sx={{
                flex: 1,
                background: "linear-gradient(145deg, #9C27B0, #E91E63)",
                color: "white",
                borderRadius: 3,
                boxShadow: "0 8px 16px rgba(156, 39, 176, 0.3)",
                minHeight: { xs: "120px", sm: "140px" },
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Payment sx={{ fontSize: { xs: 20, sm: 24 }, mr: 1 }} />
                  <Typography
                    variant={isMobile ? "body2" : "body1"}
                    sx={{ fontWeight: "medium" }}
                  >
                    Total Transactions
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: "bold" }}>
                  {pagination.totalRecords}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </motion.div>

      {/* Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} /> Filters
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2,
              '& > *': { 
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 16px)' },
                minWidth: { xs: '100%', sm: '200px' }
              } 
            }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="deposit">Deposit</MenuItem>
                  <MenuItem value="withdrawal">Withdrawal</MenuItem>
                  <MenuItem value="game_purchase">Game Purchase</MenuItem>
                  <MenuItem value="winning">Winning</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Search Reference"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />

              <FormControl fullWidth size="small">
                <InputLabel>Items per page</InputLabel>
                <Select
                  value={filters.limit}
                  label="Items per page"
                  onChange={(e) => handleFilterChange('limit', e.target.value)}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} sx={{ color: '#3498db' }} />
        </Box>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: 'linear-gradient(145deg, #3498db, #2980b9)' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reference</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getTypeIcon(transaction.type)}
                            <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                              {transaction.type.replace('_', ' ')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              color: transaction.type === 'withdrawal' || transaction.type === 'game_purchase' 
                                ? 'error.main' 
                                : 'success.main'
                            }}
                          >
                            {transaction.type === 'withdrawal' || transaction.type === 'game_purchase' 
                              ? `-${formatCurrency(transaction.amount)}`
                              : `+${formatCurrency(transaction.amount)}`
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.status}
                            color={getStatusColor(transaction.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {transaction.reference}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {transaction.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(transaction.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {transactions.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    No transactions found. {filters.type || filters.status ? 'Try changing your filters.' : 'No transactions recorded yet.'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.total > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.total}
                page={pagination.current}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}

          {/* Pagination Info */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {transactions.length} of {pagination.totalRecords} transactions
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}