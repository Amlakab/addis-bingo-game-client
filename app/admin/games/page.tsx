'use client';

import { FiPlusCircle } from "react-icons/fi";
import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Alert, Snackbar, CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Add, Edit, Delete, Search, Casino,
  Numbers, AccessTime
} from '@mui/icons-material';
import api from '@/app/utils/api';

interface Game {
  _id: string;
  betAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function GamesPage() {
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
        p: 3,
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            Games Management
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
            flexWrap: 'wrap',
            gap: 3,
            mb: 4,
          }}
        >
          {/* Total Games */}
          <Card
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 48%' },
              background: 'linear-gradient(145deg, #2196F3, #21CBF3)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)',
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Numbers sx={{ fontSize: { xs: 30, sm: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {games.length}
              </Typography>
              <Typography variant="h6">Total Games</Typography>
            </CardContent>
          </Card>

          {/* Total Bet Amount */}
          <Card
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 48%' },
              background: 'linear-gradient(145deg, #4CAF50, #8BC34A)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Casino sx={{ fontSize: { xs: 30, sm: 40 }, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {totalPrizePool.toLocaleString()}
              </Typography>
              <Typography variant="h6">Total Bet Amount</Typography>
            </CardContent>
          </Card>
        </Box>
      </motion.div>

      {/* Search Bar */}
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
            mb: 4,
            alignItems: 'center',
          }}
        >
          <TextField
            fullWidth
            placeholder="Search games by bet amount or ID..."
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
              },
            }}
          />
          <Button
            variant="contained"
            onClick={() => handleOpenDialog()}
            sx={{
              background: "linear-gradient(145deg, #3498db, #2980b9)",
              borderRadius: 2,
              px: 2,
              py: 1,
              width: { xs: '100%', sm: 'auto' },
              boxShadow: "0 4px 8px rgba(52, 152, 219, 0.3)",
              "&:hover": {
                background: "linear-gradient(145deg, #2980b9, #2471a3)",
              },
            }}
          >
            <FiPlusCircle size={22} />
          </Button>
        </Box>
      </motion.div>

      {/* Games List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} sx={{ color: '#3498db' }} />
        </Box>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 3,
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
                      borderRadius: 3,
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                      background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Chip icon={<Casino />} label={`${game.betAmount} BIRR`} color="primary" sx={{ fontWeight: 'bold' }} />
                        <Chip icon={<AccessTime />} label={new Date(game.createdAt).toLocaleDateString()} variant="outlined" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'monospace' }}>
                        ID: {game._id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Updated: {new Date(game.updatedAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => handleOpenDialog(game)}
                        fullWidth
                        sx={{
                          borderRadius: 2,
                          fontWeight: 'bold',
                          borderColor: '#3498db',
                          color: '#3498db',
                          '&:hover': { borderColor: '#2980b9', background: 'rgba(52,152,219,0.1)' },
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Delete />}
                        onClick={() => handleDelete(game._id)}
                        fullWidth
                        sx={{
                          borderRadius: 2,
                          fontWeight: 'bold',
                          borderColor: '#e74c3c',
                          color: '#e74c3c',
                          '&:hover': { borderColor: '#c0392b', background: 'rgba(231,76,60,0.1)' },
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </Box>

          {filteredGames.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No games found. {searchTerm ? 'Try a different search.' : 'Create your first game!'}
              </Typography>
            </Box>
          )}
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
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
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
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
