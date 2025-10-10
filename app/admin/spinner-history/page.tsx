'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  TextField, Chip, Alert, Snackbar, CircularProgress,
  useTheme, useMediaQuery, IconButton, Pagination
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Casino, EmojiEvents, AccountBalance,
  CalendarToday, People, Timeline,
  ExpandMore, ExpandLess
} from '@mui/icons-material';
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
  __v: number;
}

interface EarningsData {
  totalEarnings: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  totalGames: number;
  averagePrizePool: number;
  totalPlayers: number;
  totalEarningsAmount: number;
}

export default function SpinnerHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [spinnerHistory, setSpinnerHistory] = useState<SpinnerHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<SpinnerHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    dailyEarnings: 0,
    weeklyEarnings: 0,
    totalGames: 0,
    averagePrizePool: 0,
    totalPlayers: 0,
    totalEarningsAmount: 0
  });
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isMobile ? 6 : 12;

  useEffect(() => {
    fetchSpinnerHistory();
  }, []);

  useEffect(() => {
    if (spinnerHistory && spinnerHistory.length > 0) {
      const filtered = spinnerHistory.filter(game =>
        game.winnerId.phone.includes(searchTerm) ||
        game.winnerNumber.toString().includes(searchTerm) ||
        game.betAmount.toString().includes(searchTerm) ||
        game._id.includes(searchTerm)
      );
      setFilteredHistory(filtered);
      setCurrentPage(1); // Reset to first page when search changes
    } else {
      setFilteredHistory([]);
    }
  }, [searchTerm, spinnerHistory]);

  useEffect(() => {
    if (spinnerHistory.length > 0) {
      calculateEarningsData();
    }
  }, [spinnerHistory]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const fetchSpinnerHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/spinner/history');
      setSpinnerHistory(response.data);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch spinner history');
    } finally {
      setLoading(false);
    }
  };

  const calculateEarningsData = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    let totalEarnings = 0;
    let dailyEarnings = 0;
    let weeklyEarnings = 0;
    let totalPrizePool = 0;
    let totalPlayers = 0;
    let totalEarningsAmount = 0;

    spinnerHistory.forEach(game => {
      const totalCollection = game.betAmount * game.numberOfPlayers;
      const gameEarnings = totalCollection * 0.2;
      
      totalEarningsAmount += gameEarnings;
      totalPrizePool += game.prizePool;
      totalPlayers += game.numberOfPlayers;

      const gameDate = new Date(game.createdAt);
      
      if (gameDate >= oneDayAgo) {
        dailyEarnings += gameEarnings;
      }
      
      if (gameDate >= oneWeekAgo) {
        weeklyEarnings += gameEarnings;
      }
    });

    setEarningsData({
      totalEarnings: spinnerHistory.length,
      dailyEarnings,
      weeklyEarnings,
      totalGames: spinnerHistory.length,
      averagePrizePool: spinnerHistory.length > 0 ? totalPrizePool / spinnerHistory.length : 0,
      totalPlayers,
      totalEarningsAmount
    });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const toggleExpandGame = (gameId: string) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              fontWeight: 'bold', 
              color: '#2c3e50', 
              mb: 1,
            }}
          >
            Spinner Game History
          </Typography>
          <Typography 
            variant={isMobile ? "body2" : "body1"} 
            color="text.secondary"
          >
            Comprehensive overview of all spinner game results and earnings
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(5, 1fr)'
            },
            gap: 2,
            mb: 3,
          }}
        >
          {[
            {
              icon: <AccountBalance sx={{ fontSize: { xs: 24, sm: 30 } }} />,
              value: formatCurrency(earningsData.totalEarningsAmount),
              label: 'Total Earnings',
              bg: 'linear-gradient(145deg, #4CAF50, #8BC34A)',
            },
            {
              icon: <CalendarToday sx={{ fontSize: { xs: 24, sm: 30 } }} />,
              value: formatCurrency(earningsData.dailyEarnings),
              label: 'Daily Earnings',
              bg: 'linear-gradient(145deg, #2196F3, #21CBF3)',
            },
            {
              icon: <Timeline sx={{ fontSize: { xs: 24, sm: 30 } }} />,
              value: formatCurrency(earningsData.weeklyEarnings),
              label: 'Weekly Earnings',
              bg: 'linear-gradient(145deg, #FF9800, #FFC107)',
            },
            {
              icon: <Casino sx={{ fontSize: { xs: 24, sm: 30 } }} />,
              value: earningsData.totalGames,
              label: 'Total Games',
              bg: 'linear-gradient(145deg, #9C27B0, #E91E63)',
            },
            {
              icon: <EmojiEvents sx={{ fontSize: { xs: 24, sm: 30 } }} />,
              value: formatCurrency(earningsData.averagePrizePool),
              label: 'Avg. Prize Pool',
              bg: 'linear-gradient(145deg, #F44336, #FF5722)',
            },
          ].map((card, index) => (
            <Card
              key={index}
              sx={{
                background: card.bg,
                color: 'white',
                borderRadius: 2,
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                {card.icon}
                <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: 'bold', mt: 1 }}>
                  {card.value}
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} sx={{ opacity: 0.9 }}>
                  {card.label}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search spinner games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              },
            }}
          />
        </Box>
      </motion.div>

      {/* Spinner History */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={isMobile ? 40 : 60} sx={{ color: '#3498db' }} />
        </Box>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Games Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)'
              },
              gap: 2,
              mb: 3,
            }}
          >
            <AnimatePresence>
              {paginatedHistory.map((game, index) => {
                const totalCollection = game.betAmount * game.numberOfPlayers;
                const gameEarnings = totalCollection * 0.2;
                const isExpanded = expandedGame === game._id;
                
                return (
                  <motion.div
                    key={game._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card
                      sx={{
                        borderRadius: 2,
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                        background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleExpandGame(game._id)}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        {/* Header with Date and Expand Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            {formatDate(game.createdAt)}
                          </Typography>
                          <IconButton 
                            size="small" 
                            sx={{ p: 0 }}
                          >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                        
                        {/* Winner Info */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            Winner:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}>
                            {game.winnerId.phone}
                          </Typography>
                        </Box>
                        
                        {/* Winning Number */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2">Winning Number:</Typography>
                          <Chip
                            label={game.winnerNumber}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                          >
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Bet Amount:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {formatCurrency(game.betAmount)}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Players:</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <People sx={{ fontSize: 16, mr: 0.5 }} />
                                  <Typography variant="body2">{game.numberOfPlayers}</Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Prize Pool:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {formatCurrency(game.prizePool)}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Selected Numbers:</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {game.selectedNumbers.length}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Earnings (20%):</Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 'bold',
                                    color: 'success.main'
                                  }}
                                >
                                  {formatCurrency(gameEarnings)}
                                </Typography>
                              </Box>
                            </Box>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Box>

          {/* Pagination */}
          {filteredHistory.length > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 2,
                    fontWeight: 'bold',
                  },
                }}
              />
            </Box>
          )}

          {/* Results Count */}
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
            Showing {paginatedHistory.length} of {filteredHistory.length} results
          </Typography>

          {filteredHistory.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', mt: 4, p: 3 }}>
              <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary">
                No spinner history found. {searchTerm ? 'Try a different search.' : 'No spinner games have been played yet.'}
              </Typography>
            </Box>
          )}
        </motion.div>
      )}

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}