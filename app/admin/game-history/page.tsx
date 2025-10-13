'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  Chip, Alert, Snackbar, CircularProgress,
  useTheme, useMediaQuery, IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Search, Casino, EmojiEvents, AccountBalance,
  CalendarToday, People, Timeline,
  ExpandMore, ExpandLess
} from '@mui/icons-material';
import api from '@/app/utils/api';

interface GameHistory {
  _id: string;
  winnerId: {
    _id: string;
    phone: string;
  }|null;
  winnerCard: number;
  prizePool: number;
  numberOfPlayers: number;
  betAmount: number;
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
}

export default function GameHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<GameHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [earningsData, setEarningsData] = useState<EarningsData>({
    totalEarnings: 0,
    dailyEarnings: 0,
    weeklyEarnings: 0,
    totalGames: 0,
    averagePrizePool: 0,
    totalPlayers: 0
  });
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  useEffect(() => {
    fetchGameHistory();
  }, []);

 useEffect(() => {
  if (gameHistory && gameHistory.length > 0) {
    const filtered = gameHistory.filter(game =>
      (game.winnerId?.phone || '').includes(searchTerm) ||
      game.winnerCard.toString().includes(searchTerm) ||
      game.betAmount.toString().includes(searchTerm) ||
      game._id.includes(searchTerm)
    );
    setFilteredHistory(filtered);
  } else {
    setFilteredHistory([]);
  }
}, [searchTerm, gameHistory]);

  useEffect(() => {
    if (gameHistory.length > 0) {
      calculateEarningsData();
    }
  }, [gameHistory]);

  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/game/history');
      setGameHistory(response.data);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch game history');
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

    gameHistory.forEach(game => {
      // Calculate earnings: (betAmount * numberOfPlayers) - prizePool
      const gameEarnings = (game.betAmount * game.numberOfPlayers) - game.prizePool;
      totalEarnings += gameEarnings;

      const gameDate = new Date(game.createdAt);
      
      if (gameDate >= oneDayAgo) {
        dailyEarnings += gameEarnings;
      }
      
      if (gameDate >= oneWeekAgo) {
        weeklyEarnings += gameEarnings;
      }

      totalPrizePool += game.prizePool;
      totalPlayers += game.numberOfPlayers;
    });

    setEarningsData({
      totalEarnings,
      dailyEarnings,
      weeklyEarnings,
      totalGames: gameHistory.length,
      averagePrizePool: totalPrizePool / gameHistory.length,
      totalPlayers
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

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
            Game History Dashboard
          </Typography>
          <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
            Comprehensive overview of all game results and earnings
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
            mb: 4,
          }}
        >
          {[
            {
              icon: <AccountBalance sx={{ fontSize: { xs: 24, sm: 30 } }} />,
              value: formatCurrency(earningsData.totalEarnings),
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
                minHeight: '120px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 2, md: 3 } }}>
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
            placeholder="Search games..."
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
                fontSize: { xs: '0.875rem', sm: '1rem' },
              },
              '& .MuiInputBase-input': {
                padding: { xs: '10px 12px', sm: '12px 14px' },
              },
            }}
          />
        </Box>
      </motion.div>

      {/* Game History */}
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
          {/* Mobile View - Cards */}
          {isMobile && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredHistory.map((game) => {
                const gameEarnings = (game.betAmount * game.numberOfPlayers) - game.prizePool;
                const isExpanded = expandedGame === game._id;
                
                return (
                  <Card key={game._id} sx={{ borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {formatDate(game.createdAt)}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => toggleExpandGame(game._id)}
                          sx={{ p: 0 }}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Winner:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {game.winnerId ? game.winnerId.phone : 'No winner'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Card:</Typography>
                        <Chip
                          label={game.winnerCard}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 'bold', height: 24 }}
                        />
                      </Box>

                      {isExpanded && (
                        <>
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
                            <Typography variant="body2">Earnings:</Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: gameEarnings >= 0 ? 'success.main' : 'error.main'
                              }}
                            >
                              {formatCurrency(gameEarnings)}
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

          {/* Desktop/Tablet View - Table */}
          {!isMobile && (
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(145deg, #3498db, #2980b9)' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Winner Phone</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Winner Card</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Bet Amount</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Players</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Prize Pool</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>Earnings</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory.map((game) => {
                    const gameEarnings = (game.betAmount * game.numberOfPlayers) - game.prizePool;
                    
                    return (
                      <TableRow key={game._id} hover>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          {formatDate(game.createdAt)}
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          {game.winnerId ? game.winnerId.phone : 'No winner'}
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          <Chip
                            label={game.winnerCard}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          {formatCurrency(game.betAmount)}
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <People sx={{ fontSize: 16, mr: 0.5 }} />
                            {game.numberOfPlayers}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          {formatCurrency(game.prizePool)}
                        </TableCell>
                        <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 'bold' }}>
                          <Typography color={gameEarnings >= 0 ? 'success.main' : 'error.main'}>
                            {formatCurrency(gameEarnings)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {filteredHistory.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', mt: 4, p: 3 }}>
              <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary">
                No game history found. {searchTerm ? 'Try a different search.' : 'No games have been played yet.'}
              </Typography>
            </Box>
          )}
        </motion.div>
      )}

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error" onClose={() => setError('')} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}