'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  Chip, Alert, Snackbar, CircularProgress,
  useTheme, useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Search, Casino, EmojiEvents, AccountBalance,
  CalendarToday, People, Timeline
} from '@mui/icons-material';
import api from '@/app/utils/api';

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

  useEffect(() => {
    fetchGameHistory();
  }, []);

  useEffect(() => {
    if (gameHistory && gameHistory.length > 0) {
      const filtered = gameHistory.filter(game =>
        game.winnerId.phone.includes(searchTerm) ||
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
            Game History Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
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
      display: 'flex',
      flexWrap: 'wrap', // allows wrapping on smaller screens
      gap: 3,
      mb: 4,
    }}
  >
    {/* Card Template */}
    {[
      {
        icon: <AccountBalance sx={{ fontSize: { xs: 30, sm: 40 }, mb: 1 }} />,
        value: formatCurrency(earningsData.totalEarnings),
        label: 'Total Earnings',
        bg: 'linear-gradient(145deg, #4CAF50, #8BC34A)',
        shadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
      },
      {
        icon: <CalendarToday sx={{ fontSize: { xs: 30, sm: 40 }, mb: 1 }} />,
        value: formatCurrency(earningsData.dailyEarnings),
        label: 'Daily Earnings',
        bg: 'linear-gradient(145deg, #2196F3, #21CBF3)',
        shadow: '0 8px 16px rgba(33, 150, 243, 0.3)',
      },
      {
        icon: <Timeline sx={{ fontSize: { xs: 30, sm: 40 }, mb: 1 }} />,
        value: formatCurrency(earningsData.weeklyEarnings),
        label: 'Weekly Earnings',
        bg: 'linear-gradient(145deg, #FF9800, #FFC107)',
        shadow: '0 8px 16px rgba(255, 152, 0, 0.3)',
      },
      {
        icon: <Casino sx={{ fontSize: { xs: 30, sm: 40 }, mb: 1 }} />,
        value: earningsData.totalGames,
        label: 'Total Games',
        bg: 'linear-gradient(145deg, #9C27B0, #E91E63)',
        shadow: '0 8px 16px rgba(156, 39, 176, 0.3)',
      },
      {
        icon: <EmojiEvents sx={{ fontSize: { xs: 30, sm: 40 }, mb: 1 }} />,
        value: formatCurrency(earningsData.averagePrizePool),
        label: 'Avg. Prize Pool',
        bg: 'linear-gradient(145deg, #F44336, #FF5722)',
        shadow: '0 8px 16px rgba(244, 67, 54, 0.3)',
      },
    ].map((card, index) => (
      <Card
        key={index}
        sx={{
          flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 30%', lg: '1 1 18%' },
          background: card.bg,
          color: 'white',
          borderRadius: 3,
          boxShadow: card.shadow,
          height: '100%',
        }}
      >
        <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
          {card.icon}
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
            {card.value}
          </Typography>
          <Typography variant={isMobile ? 'body2' : 'body1'}>{card.label}</Typography>
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
  <Box sx={{ mb: 4, width: '100%' }}>
    <TextField
      fullWidth
      placeholder="Search by phone, card number, bet amount, or ID..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      InputProps={{
        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          background: 'white',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          fontSize: { xs: '0.875rem', sm: '1rem' }, // slightly smaller on mobile
        },
        '& .MuiInputBase-input': {
          padding: { xs: '10px 12px', sm: '12px 14px' }, // responsive padding
        },
      }}
    />
  </Box>
</motion.div>


      {/* Game History Table */}
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
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
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
                        {game.winnerId.phone}
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

          {filteredHistory.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="text.secondary" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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