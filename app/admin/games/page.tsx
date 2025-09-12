'use client';

import { FiPlusCircle } from "react-icons/fi";
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Alert, Snackbar, CircularProgress,
  useTheme, useMediaQuery, IconButton
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Add, Edit, Delete, Search, Casino,
  Numbers, AccessTime, FilterList
} from '@mui/icons-material';
import api from '@/app/utils/api';

interface Game {
  _id: string;
  betAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function GamesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [formData, setFormData] = useState({ betAmount: '' });

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (games.length > 0) {
      const filtered = games.filter((game) =>
        game.betAmount.toString().includes(searchTerm) ||
        game._id.includes(searchTerm)
      );
      setFilteredGames(filtered);
    } else {
      setFilteredGames([]);
    }
  }, [searchTerm, games]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await api.get('/games');
      setGames(response.data.data);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (game: Game | null = null) => {
    if (game) {
      setEditingGame(game);
      setFormData({ betAmount: game.betAmount.toString() });
    } else {
      setEditingGame(null);
      setFormData({ betAmount: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGame(null);
    setFormData({ betAmount: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      const betAmount = parseInt(formData.betAmount);

      if (betAmount < 1 || betAmount > 10000) {
        setError('Bet amount must be between 1 and 10000');
        return;
      }

      if (editingGame) {
        await api.put(`/games/${editingGame._id}`, { betAmount });
        setSuccess('Game updated successfully');
      } else {
        await api.post('/games', { betAmount });
        setSuccess('Game created successfully');
      }

      handleCloseDialog();
      fetchGames();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
      await api.delete(`/games/${id}`);
      setSuccess('Game deleted successfully');
      fetchGames();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to delete game');
    }
  };

  const totalPrizePool = games.reduce((total, game) => total + game.betAmount, 0);

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
            Games Management
          </Typography>
          <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
            Create and manage game betting amounts
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
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Total Games */}
          <Card
            sx={{
              background: 'linear-gradient(145deg, #2196F3, #21CBF3)',
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)',
            }}
          >
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Numbers sx={{ fontSize: { xs: 24, sm: 30 }, mb: 1 }} />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                {games.length}
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"}>Total Games</Typography>
            </CardContent>
          </Card>

          {/* Total Bet Amount */}
          <Card
            sx={{
              background: 'linear-gradient(145deg, #4CAF50, #8BC34A)',
              color: 'white',
              borderRadius: 2,
              boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)',
            }}
          >
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Casino sx={{ fontSize: { xs: 24, sm: 30 }, mb: 1 }} />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                {totalPrizePool.toLocaleString()}
              </Typography>
              <Typography variant={isMobile ? "body2" : "body1"}>Total Bet Amount</Typography>
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      {/* Search and Action Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              },
            }}
          />
          <Button
            variant="contained"
            onClick={() => handleOpenDialog()}
            startIcon={<FiPlusCircle size={18} />}
            sx={{
              background: "linear-gradient(145deg, #3498db, #2980b9)",
              borderRadius: 2,
              px: 2,
              py: 1,
              minWidth: 'auto',
              whiteSpace: 'nowrap',
              boxShadow: "0 4px 8px rgba(52, 152, 219, 0.3)",
              "&:hover": {
                background: "linear-gradient(145deg, #2980b9, #2471a3)",
              },
            }}
          >
            {isMobile ? 'Add' : 'Add Game'}
          </Button>
        </Box>
      </motion.div>

      {/* Games List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={isMobile ? 40 : 60} sx={{ color: '#3498db' }} />
        </Box>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
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
            }}
          >
            <AnimatePresence>
              {filteredGames.map((game, index) => (
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
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Chip 
                          icon={<Casino sx={{ fontSize: 16 }} />} 
                          label={`${game.betAmount} BIRR`} 
                          color="primary" 
                          size={isMobile ? "small" : "medium"}
                          sx={{ fontWeight: 'bold' }} 
                        />
                        <Chip 
                          icon={<AccessTime sx={{ fontSize: 16 }} />} 
                          label={new Date(game.createdAt).toLocaleDateString()} 
                          variant="outlined" 
                          size={isMobile ? "small" : "medium"}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        ID: {game._id.slice(-8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        Updated: {new Date(game.updatedAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={() => handleOpenDialog(game)}
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: '#3498db',
                          color: '#3498db',
                          '&:hover': { borderColor: '#2980b9', background: 'rgba(52,152,219,0.1)' },
                        }}
                        title="Edit"
                      >
                        <Edit sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(game._id)}
                        sx={{
                          flex: 1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: '#e74c3c',
                          color: '#e74c3c',
                          '&:hover': { borderColor: '#c0392b', background: 'rgba(231,76,60,0.1)' },
                        }}
                        title="Delete"
                      >
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>

          {filteredGames.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', mt: 4, p: 3 }}>
              <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary">
                No games found. {searchTerm ? 'Try a different search.' : 'Create your first game!'}
              </Typography>
            </Box>
          )}
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
            {editingGame ? 'Edit Game' : 'Create New Game'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Bet Amount"
            name="betAmount"
            type="number"
            value={formData.betAmount}
            onChange={handleInputChange}
            margin="normal"
            inputProps={{ min: 1, max: 10000 }}
            helperText="Enter a value between 1 and 10000"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              background: 'linear-gradient(145deg, #3498db, #2980b9)',
              '&:hover': { background: 'linear-gradient(145deg, #2980b9, #2471a3)' },
            }}
          >
            {editingGame ? 'Update' : 'Create'}
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