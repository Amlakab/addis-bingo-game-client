'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Pagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AccountBalanceWallet,
  ArrowUpward,
  ArrowDownward,
  Casino,
  EmojiEvents,
  Search,
  FilterList,
  ExpandMore,
  ExpandLess,
  Delete,
  DeleteSweep,
  ClearAll,
  CheckBox,
  CheckBoxOutlineBlank
} from '@mui/icons-material';
import api from '@/app/utils/api';

interface Transaction {
  _id: string;
  userId: { _id: string; phone: string; name?: string };
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
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

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
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'bulk' | 'all'>('single');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteFilters, setBulkDeleteFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      // Reset selection when data changes
      setSelectedTransactions([]);
      setSelectAll(false);
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
      page: field !== 'page' ? 1 : prev.page
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    handleFilterChange('page', value);
  };

  const toggleExpandTransaction = (transactionId: string) => {
    setExpandedTransaction(expandedTransaction === transactionId ? null : transactionId);
  };

  // Delete Handlers
  const handleDeleteSingle = (transactionId: string) => {
    setDeleteType('single');
    setDeleteTarget(transactionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBulk = () => {
    if (selectedTransactions.length === 0) {
      setError('Please select at least one transaction to delete');
      return;
    }
    setDeleteType('bulk');
    setDeleteDialogOpen(true);
  };

  const handleDeleteAll = () => {
    setDeleteType('all');
    setDeleteDialogOpen(true);
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      status: '',
      search: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10
    });
    setSelectedTransactions([]);
    setSelectAll(false);
  };

  const confirmDeleteAction = async () => {
    try {
      setLoading(true);
      let response;

      if (deleteType === 'single' && deleteTarget) {
        response = await api.delete(`/transactions/${deleteTarget}`);
        setSuccess('Transaction deleted successfully');
      } else if (deleteType === 'bulk') {
        // Delete selected transactions
        const deletePromises = selectedTransactions.map(id => 
          api.delete(`/transactions/${id}`)
        );
        await Promise.all(deletePromises);
        setSuccess(`Successfully deleted ${selectedTransactions.length} transactions`);
        setSelectedTransactions([]);
        setSelectAll(false);
      } else if (deleteType === 'all') {
        // Delete all transactions with confirmation
        response = await api.delete('/transactions/all?confirm=true');
        setSuccess(response.data.message || 'All transactions deleted successfully');
      }

      setDeleteDialogOpen(false);
      // Refresh data
      await fetchTransactions();
      await fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete transaction(s)');
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  // Selection handlers
  const handleSelectTransaction = (transactionId: string) => {
    setSelectedTransactions(prev => {
      if (prev.includes(transactionId)) {
        return prev.filter(id => id !== transactionId);
      } else {
        return [...prev, transactionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t._id));
    }
    setSelectAll(!selectAll);
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
      case 'deposit':
        return <ArrowDownward sx={{ color: 'success.main', fontSize: 18 }} />;
      case 'withdrawal':
        return <ArrowUpward sx={{ color: 'error.main', fontSize: 18 }} />;
      case 'game_purchase':
        return <Casino sx={{ color: 'warning.main', fontSize: 18 }} />;
      case 'winning':
        return <EmojiEvents sx={{ color: 'success.main', fontSize: 18 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

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
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header with Action Buttons */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
              Transaction History
            </Typography>
            <Typography variant={isMobile ? 'body2' : 'body1'} color="text.secondary">
              Track all your financial activities and game transactions
            </Typography>
          </Box>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Clear all filters">
              <Button
                variant="outlined"
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<ClearAll />}
                onClick={handleClearFilters}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                {!isMobile && 'Clear Filters'}
              </Button>
            </Tooltip>

            {selectedTransactions.length > 0 && (
              <Tooltip title={`Delete ${selectedTransactions.length} selected transactions`}>
                <Button
                  variant="contained"
                  color="error"
                  size={isMobile ? 'small' : 'medium'}
                  startIcon={<DeleteSweep />}
                  onClick={handleDeleteBulk}
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    background: 'linear-gradient(145deg, #f44336, #d32f2f)',
                    '&:hover': {
                      background: 'linear-gradient(145deg, #d32f2f, #c62828)'
                    }
                  }}
                >
                  {!isMobile ? `Delete Selected (${selectedTransactions.length})` : `${selectedTransactions.length}`}
                </Button>
              </Tooltip>
            )}

            <Tooltip title="Delete all transactions (use with caution)">
              <Button
                variant="contained"
                color="error"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<DeleteSweep />}
                onClick={handleDeleteAll}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  background: 'linear-gradient(145deg, #ff1744, #d50000)',
                  '&:hover': {
                    background: 'linear-gradient(145deg, #d50000, #b71c1c)'
                  }
                }}
              >
                {!isMobile ? 'Delete All' : 'All'}
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* Stats Cards - same as before */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          {/* Net Balance Card */}
          <Card sx={{ flex: '1 1 200px', background: 'linear-gradient(145deg, #2196F3, #21CBF3)', color: 'white', borderRadius: 2, boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWallet sx={{ fontSize: 20, mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Net Balance
                </Typography>
              </Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold', color: netBalance >= 0 ? 'inherit' : '#ff6b6b' }}>
                {formatCurrency(netBalance)}
              </Typography>
            </CardContent>
          </Card>

          {/* Total Deposits Card */}
          <Card sx={{ flex: '1 1 200px', background: 'linear-gradient(145deg, #4CAF50, #8BC34A)', color: 'white', borderRadius: 2, boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ArrowDownward sx={{ fontSize: 20, mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Total Deposits
                </Typography>
              </Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {formatCurrency(totalDeposits)}
              </Typography>
            </CardContent>
          </Card>

          {/* Total Withdrawals Card */}
          <Card sx={{ flex: '1 1 200px', background: 'linear-gradient(145deg, #F44336, #FF5722)', color: 'white', borderRadius: 2, boxShadow: '0 4px 8px rgba(244, 67, 54, 0.3)' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ArrowUpward sx={{ fontSize: 20, mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Total Withdrawals
                </Typography>
              </Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {formatCurrency(totalWithdrawals)}
              </Typography>
            </CardContent>
          </Card>

          {/* Total Transactions Card */}
          <Card sx={{ flex: '1 1 200px', background: 'linear-gradient(145deg, #9C27B0, #E91E63)', color: 'white', borderRadius: 2, boxShadow: '0 4px 8px rgba(156, 39, 176, 0.3)' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Total Transactions
                </Typography>
              </Box>
              <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
                {pagination.totalRecords}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      {/* Filter Section - same as before with minor changes */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterList sx={{ mr: 1, fontSize: 20 }} /> Filters
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={handleClearFilters} startIcon={<ClearAll />}>
                  Clear
                </Button>
                <IconButton size="small" onClick={() => setShowFilters(!showFilters)} sx={{ display: { sm: 'none' } }}>
                  {showFilters ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
            </Box>

            <Collapse in={showFilters || !isMobile}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControl sx={{ flex: '1 1 200px' }} size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={filters.type} label="Type" onChange={e => handleFilterChange('type', e.target.value)}>
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="deposit">Deposit</MenuItem>
                    <MenuItem value="withdrawal">Withdrawal</MenuItem>
                    <MenuItem value="game_purchase">Game Purchase</MenuItem>
                    <MenuItem value="winning">Winning</MenuItem>
                  </Select>
                </FormControl>

                <FormControl sx={{ flex: '1 1 200px' }} size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={filters.status} label="Status" onChange={e => handleFilterChange('status', e.target.value)}>
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  sx={{ flex: '1 1 200px' }}
                  size="small"
                  fullWidth
                  label="Search Reference"
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> }}
                />

                <FormControl sx={{ flex: '1 1 200px' }} size="small">
                  <InputLabel>Items per page</InputLabel>
                  <Select value={filters.limit} label="Items per page" onChange={e => handleFilterChange('limit', e.target.value)}>
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Table with Selection */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={isMobile ? 40 : 60} sx={{ color: '#3498db' }} />
        </Box>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
          {/* Mobile Cards with Delete */}
          {isMobile && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {transactions.map(t => {
                const isExpanded = expandedTransaction === t._id;
                const isSelected = selectedTransactions.includes(t._id);
                return (
                  <Card key={t._id} sx={{ borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => handleSelectTransaction(t._id)}
                            sx={{ p: 0, mr: 1 }}
                          />
                          {getTypeIcon(t.type)}
                          <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {t.type.replace('_', ' ')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton size="small" onClick={() => handleDeleteSingle(t._id)} sx={{ color: 'error.main' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => toggleExpandTransaction(t._id)} sx={{ p: 0 }}>
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Amount:</Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 'bold',
                            color: t.type === 'withdrawal' || t.type === 'game_purchase' ? 'error.main' : 'success.main'
                          }}
                        >
                          {t.type === 'withdrawal' || t.type === 'game_purchase' ? `-${formatCurrency(t.amount)}` : `+${formatCurrency(t.amount)}`}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Status:</Typography>
                        <Chip label={t.status} color={getStatusColor(t.status) as any} size="small" sx={{ height: 24, fontSize: '0.7rem' }} />
                      </Box>

                      {isExpanded && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Reference:</Typography>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {t.reference}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Description:</Typography>
                            <Typography variant="body2" sx={{ textAlign: 'right', fontSize: '0.8rem' }}>
                              {t.description}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Date:</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {formatDate(t.createdAt)}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* Desktop/Table View with Selection */}
          {!isMobile && (
            <Card sx={{ borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: 'linear-gradient(145deg, #3498db, #2980b9)' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem', width: '40px' }}>
                          <Checkbox
                            checked={selectAll}
                            indeterminate={selectedTransactions.length > 0 && selectedTransactions.length < transactions.length}
                            onChange={handleSelectAll}
                            sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Type</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Amount</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Reference</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Description</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Date</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map(t => (
                        <TableRow key={t._id} hover>
                          <TableCell>
                            <Checkbox
                              checked={selectedTransactions.includes(t._id)}
                              onChange={() => handleSelectTransaction(t._id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getTypeIcon(t.type)}
                              <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                                {t.type.replace('_', ' ')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 'bold',
                                color: t.type === 'withdrawal' || t.type === 'game_purchase' ? 'error.main' : 'success.main'
                              }}
                            >
                              {t.type === 'withdrawal' || t.type === 'game_purchase' ? `-${formatCurrency(t.amount)}` : `+${formatCurrency(t.amount)}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={t.status} color={getStatusColor(t.status) as any} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {t.reference}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {t.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {formatDate(t.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Tooltip title="Delete this transaction">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteSingle(t._id)}
                                sx={{ color: 'error.main' }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
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
          )}

          {/* Pagination */}
          {pagination.total > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={pagination.total} page={pagination.current} onChange={handlePageChange} color="primary" size={isMobile ? 'small' : 'medium'} />
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {transactions.length} of {pagination.totalRecords} transactions
              {selectedTransactions.length > 0 && ` | ${selectedTransactions.length} selected`}
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <Delete /> 
          {deleteType === 'single' && 'Delete Transaction'}
          {deleteType === 'bulk' && `Delete ${selectedTransactions.length} Transactions`}
          {deleteType === 'all' && 'Delete All Transactions'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteType === 'single' && 'Are you sure you want to delete this transaction? This action cannot be undone.'}
            {deleteType === 'bulk' && `Are you sure you want to delete ${selectedTransactions.length} selected transactions? This action cannot be undone.`}
            {deleteType === 'all' && (
              <>
                <Box sx={{ mt: 2 }}>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      ⚠️ This will permanently delete ALL transactions from the database!
                    </Typography>
                  </Alert>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={confirmDelete}
                        onChange={(e) => setConfirmDelete(e.target.checked)}
                      />
                    }
                    label="I understand that this action is irreversible and I want to delete all transactions"
                  />
                </Box>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setConfirmDelete(false);
          }}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteAction}
            color="error"
            variant="contained"
            disabled={deleteType === 'all' && !confirmDelete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}