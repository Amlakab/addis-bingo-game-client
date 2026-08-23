'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
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
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Collapse
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Search,
  Casino,
  EmojiEvents,
  AccountBalance,
  CalendarToday,
  People,
  Timeline,
  ExpandMore,
  ExpandLess,
  Delete,
  DeleteSweep,
  ClearAll,
  FilterList
} from '@mui/icons-material';
import api from '@/app/utils/api';

// ============================================
// INTERFACES
// ============================================
interface GameHistory {
  _id: string;
  winnerId: {
    _id: string;
    phone: string;
  } | null;
  winnerCard: number;
  prizePool: number;
  numberOfPlayers: number;
  betAmount: number;
  createdAt: string;
}

interface GroupedGame {
  gameId: string;
  betAmount: number;
  numberOfPlayers: number;
  totalCollected: number;
  totalPrizePool: number;
  systemEarnings: number;
  prizePerWinner: number;
  totalWinners: number;
  winners: Array<{
    userId: string;
    phone: string;
    cardNumber: number;
    prizeAmount: number;
  }>;
  createdAt: string;
  entries: GameHistory[];
}

interface EarningsStats {
  totalGames: number;
  totalEarnings: number;
  totalCollected: number;
  totalPrizePools: number;
  averagePlayersPerGame: number;
  averageEarningsPerGame: number;
  totalWinners: number;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function GameHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [groupedGames, setGroupedGames] = useState<GroupedGame[]>([]);
  const [filteredGames, setFilteredGames] = useState<GroupedGame[]>([]);
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    betAmount: '',
    minPlayers: '',
    maxPlayers: '',
    startDate: '',
    endDate: ''
  });

  // Delete Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'bet' | 'all'>('single');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteBetAmount, setDeleteBetAmount] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    fetchGameHistory();
  }, []);

  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/game/history');
      setGameHistory(response.data.data || []);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch game history');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // TOGGLE EXPAND
  // ============================================
  const toggleExpandGame = (gameId: string) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  // ============================================
  // GROUP GAMES BY BET + TIME WINDOW
  // ============================================
  const groupGamesByBetAndTime = (games: GameHistory[], timeWindowSeconds: number = 60): GroupedGame[] => {
    if (!games || games.length === 0) return [];

    // Sort by createdAt
    const sorted = [...games].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const groups: GameHistory[][] = [];
    let currentGroup: GameHistory[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];

      if (currentGroup.length === 0) {
        currentGroup.push(current);
      } else {
        const firstInGroup = currentGroup[0];
        const timeDiff = Math.abs(
          new Date(current.createdAt).getTime() -
          new Date(firstInGroup.createdAt).getTime()
        );

        // Same betAmount AND within time window = same game
        const isSameGame =
          current.betAmount === firstInGroup.betAmount &&
          timeDiff <= timeWindowSeconds * 1000;

        if (isSameGame) {
          currentGroup.push(current);
        } else {
          groups.push(currentGroup);
          currentGroup = [current];
        }
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    // Convert to GroupedGame objects
    return groups.map(group => {
      const betAmount = group[0].betAmount;
      const numberOfPlayers = group[0].numberOfPlayers;
      const totalPrizePool = group.reduce((sum, g) => sum + g.prizePool, 0);
      const totalCollected = numberOfPlayers * betAmount;
      const systemEarnings = totalCollected - totalPrizePool;

      return {
        gameId: group[0]._id,
        betAmount,
        numberOfPlayers,
        totalCollected,
        totalPrizePool,
        systemEarnings,
        prizePerWinner: group.length > 0 ? totalPrizePool / group.length : 0,
        totalWinners: group.length,
        winners: group.map(g => {
          // ✅ FIX: Properly extract userId as string
          let userId = 'unknown';
          if (g.winnerId) {
            if (typeof g.winnerId === 'object' && g.winnerId._id) {
              userId = g.winnerId._id;
            } else if (typeof g.winnerId === 'string') {
              userId = g.winnerId;
            }
          }
          
          return {
            userId: userId,
            phone: g.winnerId?.phone || 'Unknown',
            cardNumber: g.winnerCard,
            prizeAmount: g.prizePool
          };
        }),
        createdAt: group[0].createdAt,
        entries: group
      };
    });
  };

  // ============================================
  // CALCULATE EARNINGS STATS
  // ============================================
  const calculateStats = (games: GroupedGame[]): EarningsStats => {
    if (!games || games.length === 0) {
      return {
        totalGames: 0,
        totalEarnings: 0,
        totalCollected: 0,
        totalPrizePools: 0,
        averagePlayersPerGame: 0,
        averageEarningsPerGame: 0,
        totalWinners: 0
      };
    }

    const totalGames = games.length;
    const totalEarnings = games.reduce((sum, g) => sum + g.systemEarnings, 0);
    const totalCollected = games.reduce((sum, g) => sum + g.totalCollected, 0);
    const totalPrizePools = games.reduce((sum, g) => sum + g.totalPrizePool, 0);
    const totalWinners = games.reduce((sum, g) => sum + g.totalWinners, 0);

    return {
      totalGames,
      totalEarnings,
      totalCollected,
      totalPrizePools,
      averagePlayersPerGame: totalGames > 0 ? games.reduce((sum, g) => sum + g.numberOfPlayers, 0) / totalGames : 0,
      averageEarningsPerGame: totalGames > 0 ? totalEarnings / totalGames : 0,
      totalWinners
    };
  };

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (gameHistory && gameHistory.length > 0) {
      const grouped = groupGamesByBetAndTime(gameHistory, 60);
      setGroupedGames(grouped);
      setStats(calculateStats(grouped));
    } else {
      setGroupedGames([]);
      setStats(null);
    }
  }, [gameHistory]);

  useEffect(() => {
    if (groupedGames.length > 0) {
      let filtered = groupedGames;

      // Filter by bet amount
      if (filters.betAmount) {
        filtered = filtered.filter(g => g.betAmount === parseInt(filters.betAmount));
      }

      // Filter by min players
      if (filters.minPlayers) {
        filtered = filtered.filter(g => g.numberOfPlayers >= parseInt(filters.minPlayers));
      }

      // Filter by max players
      if (filters.maxPlayers) {
        filtered = filtered.filter(g => g.numberOfPlayers <= parseInt(filters.maxPlayers));
      }

      // Filter by date range
      if (filters.startDate) {
        filtered = filtered.filter(g => new Date(g.createdAt) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        filtered = filtered.filter(g => new Date(g.createdAt) <= new Date(filters.endDate));
      }

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(g =>
          g.winners.some(w =>
            w.phone.includes(searchTerm) ||
            w.cardNumber.toString().includes(searchTerm)
          ) ||
          g.betAmount.toString().includes(searchTerm) ||
          g.numberOfPlayers.toString().includes(searchTerm)
        );
      }

      setFilteredGames(filtered);
    } else {
      setFilteredGames([]);
    }
  }, [groupedGames, filters, searchTerm]);

  // ============================================
  // DELETE HANDLERS
  // ============================================
  const handleDeleteSingle = (gameId: string) => {
    setDeleteType('single');
    setDeleteTarget(gameId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteByBet = (betAmount: number) => {
    setDeleteType('bet');
    setDeleteBetAmount(betAmount);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAll = () => {
    setDeleteType('all');
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAction = async () => {
    try {
      setLoading(true);

      if (deleteType === 'single' && deleteTarget) {
        await api.delete(`/game/history/${deleteTarget}`);
        setSuccess('Game history entry deleted successfully');
      } else if (deleteType === 'bet' && deleteBetAmount !== null) {
        await api.delete(`/game/history/bet/${deleteBetAmount}`);
        setSuccess(`All game history for bet amount ${deleteBetAmount} ETB deleted successfully`);
      } else if (deleteType === 'all') {
        await api.delete('/game/history/all?confirm=true');
        setSuccess('All game history deleted successfully');
      }

      setDeleteDialogOpen(false);
      setConfirmDelete(false);
      // Refresh data
      await fetchGameHistory();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete');
    } finally {
      setLoading(false);
      setDeleteTarget(null);
      setDeleteBetAmount(null);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      betAmount: '',
      minPlayers: '',
      maxPlayers: '',
      startDate: '',
      endDate: ''
    });
    setSearchTerm('');
  };

  // ============================================
  // FORMAT HELPERS
  // ============================================
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUniqueBetAmounts = () => {
    const amounts = new Set<number>();
    groupedGames.forEach(g => amounts.add(g.betAmount));
    return Array.from(amounts).sort((a, b) => a - b);
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading && !gameHistory.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={isMobile ? 40 : 60} sx={{ color: '#3498db' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
              Game History Dashboard
            </Typography>
            <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
              Comprehensive overview of all game results with correct earnings calculation
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
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                {!isMobile && 'Clear Filters'}
              </Button>
            </Tooltip>

            <Tooltip title="Delete all game history (use with caution)">
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
                  '&:hover': { background: 'linear-gradient(145deg, #d50000, #b71c1c)' }
                }}
              >
                {!isMobile ? 'Delete All' : 'All'}
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(6, 1fr)' }, gap: 2, mb: 3 }}>
            {[
              { icon: <AccountBalance />, value: formatCurrency(stats.totalEarnings), label: 'Total Earnings', bg: 'linear-gradient(145deg, #4CAF50, #8BC34A)' },
              { icon: <Casino />, value: stats.totalGames, label: 'Total Games', bg: 'linear-gradient(145deg, #9C27B0, #E91E63)' },
              { icon: <People />, value: stats.totalWinners, label: 'Total Winners', bg: 'linear-gradient(145deg, #FF9800, #FFC107)' },
              { icon: <Timeline />, value: formatCurrency(stats.averageEarningsPerGame), label: 'Avg Per Game', bg: 'linear-gradient(145deg, #2196F3, #21CBF3)' },
              { icon: <CalendarToday />, value: stats.totalGames > 0 ? Math.round(stats.totalEarnings / stats.totalGames) + ' ETB' : '0 ETB', label: 'Avg Earnings', bg: 'linear-gradient(145deg, #F44336, #FF5722)' },
              { icon: <EmojiEvents />, value: formatCurrency(stats.totalPrizePools), label: 'Total Prize Pool', bg: 'linear-gradient(145deg, #795548, #8D6E63)' }
            ].map((card, index) => (
              <Card key={index} sx={{ background: card.bg, color: 'white', borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.2)', minHeight: isMobile ? '80px' : '100px' }}>
                <CardContent sx={{ textAlign: 'center', p: { xs: 1.5, sm: 2 } }}>
                  {card.icon}
                  <Typography variant={isMobile ? "subtitle2" : "h6"} sx={{ fontWeight: 'bold', mt: 0.5 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {card.label}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </motion.div>
      )}

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <Search sx={{ color: 'text.secondary' }} />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by phone, card, bet amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, background: 'white' } }}
                />
              </Box>
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterList />
              </IconButton>
            </Box>

            <Collapse in={showFilters || !isMobile}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
                  <InputLabel>Bet Amount</InputLabel>
                  <Select
                    value={filters.betAmount}
                    label="Bet Amount"
                    onChange={(e) => setFilters(prev => ({ ...prev, betAmount: e.target.value }))}
                  >
                    <MenuItem value="">All</MenuItem>
                    {getUniqueBetAmounts().map(amount => (
                      <MenuItem key={amount} value={amount}>{amount} ETB</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  label="Min Players"
                  type="number"
                  value={filters.minPlayers}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPlayers: e.target.value }))}
                  sx={{ flex: 1, minWidth: 100 }}
                />

                <TextField
                  size="small"
                  label="Max Players"
                  type="number"
                  value={filters.maxPlayers}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPlayers: e.target.value }))}
                  sx={{ flex: 1, minWidth: 100 }}
                />

                <TextField
                  size="small"
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  sx={{ flex: 1, minWidth: 120 }}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  size="small"
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  sx={{ flex: 1, minWidth: 120 }}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </motion.div>

      {/* Game History Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={isMobile ? 40 : 60} sx={{ color: '#3498db' }} />
        </Box>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
          {/* Mobile View */}
          {isMobile && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredGames.map((game) => {
                const isExpanded = expandedGame === game.gameId;
                return (
                  <Card key={game.gameId} sx={{ borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {formatDate(game.createdAt)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleDeleteSingle(game.gameId)} sx={{ color: 'error.main' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => toggleExpandGame(game.gameId)}>
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Bet:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{formatCurrency(game.betAmount)}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Players:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{game.numberOfPlayers}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Winners:</Typography>
                        <Chip label={game.totalWinners} size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Earnings:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: game.systemEarnings >= 0 ? 'success.main' : 'error.main' }}>
                          {formatCurrency(game.systemEarnings)}
                        </Typography>
                      </Box>

                      {isExpanded && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Collected:</Typography>
                            <Typography variant="body2">{formatCurrency(game.totalCollected)}</Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Prize Pool:</Typography>
                            <Typography variant="body2">{formatCurrency(game.totalPrizePool)}</Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">Per Winner:</Typography>
                            <Typography variant="body2">{formatCurrency(game.prizePerWinner)}</Typography>
                          </Box>

                          <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 'bold' }}>
                            Winners:
                          </Typography>
                          {game.winners.map((w, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', pl: 1, py: 0.25 }}>
                              <Typography variant="caption">{w.phone}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                Card {w.cardNumber} (+{formatCurrency(w.prizeAmount)})
                              </Typography>
                            </Box>
                          ))}
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {/* Desktop View */}
          {!isMobile && (
            <Card sx={{ borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: 'linear-gradient(145deg, #2c3e50, #34495e)' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Bet</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Players</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Winners</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Collected</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Prize Pool</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Earnings</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Per Winner</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredGames.map((game) => (
                        <TableRow key={game.gameId} hover>
                          <TableCell>{formatDate(game.createdAt)}</TableCell>
                          <TableCell>
                            <Chip label={`${game.betAmount} ETB`} size="small" />
                          </TableCell>
                          <TableCell>{game.numberOfPlayers}</TableCell>
                          <TableCell>
                            <Chip
                              label={game.totalWinners}
                              color={game.totalWinners > 1 ? 'success' : 'primary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(game.totalCollected)}</TableCell>
                          <TableCell>{formatCurrency(game.totalPrizePool)}</TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                fontWeight: 'bold',
                                color: game.systemEarnings >= 0 ? 'success.main' : 'error.main'
                              }}
                            >
                              {formatCurrency(game.systemEarnings)}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatCurrency(game.prizePerWinner)}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                              <Tooltip title="Delete by bet amount">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteByBet(game.betAmount)}
                                  sx={{ color: 'warning.main' }}
                                >
                                  <DeleteSweep fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete this game">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteSingle(game.gameId)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {filteredGames.length === 0 && !loading && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                      No games found. {searchTerm || Object.values(filters).some(f => f) ? 'Try changing your filters.' : 'No games have been played yet.'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredGames.length} of {groupedGames.length} games
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* ============================================ */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ============================================ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <Delete />
          {deleteType === 'single' && 'Delete Game History Entry'}
          {deleteType === 'bet' && `Delete All ${deleteBetAmount} ETB Game History`}
          {deleteType === 'all' && 'Delete All Game History'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteType === 'single' && 'Are you sure you want to delete this game history entry? This action cannot be undone.'}
            {deleteType === 'bet' && `Are you sure you want to delete ALL game history for bet amount ${deleteBetAmount} ETB? This action cannot be undone.`}
            {deleteType === 'all' && (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    ⚠️ This will permanently delete ALL game history entries from the database!
                  </Typography>
                </Alert>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="checkbox"
                      checked={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.checked)}
                    />
                    I understand that this action is irreversible and I want to delete all game history
                  </Typography>
                </Box>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setConfirmDelete(false); }}>
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

      {/* ============================================ */}
      {/* NOTIFICATIONS */}
      {/* ============================================ */}
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