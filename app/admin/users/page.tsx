'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip,
  Alert, Snackbar, CircularProgress,
  useTheme, useMediaQuery, Pagination,
  MenuItem, Select, FormControl, InputLabel,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Stack
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AccountBalance, People, Block, CheckCircle,
  PersonAdd, Refresh, Delete, Lock, LockOpen,
  AccountBalanceWallet, TrendingUp, EmojiEvents,
  MoreVert, Phone, Wallet, CalendarToday,
  SupervisorAccount // ✅ Correct role icon
} from '@mui/icons-material';
import api from '@/app/utils/api';

interface User {
  _id: string;
  phone: string;
  role: 'user' | 'agent' | 'admin';
  wallet: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  roles: { _id: string; count: number }[];
  totalWalletBalance: number;
  totalEarnings: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const UsersPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });

  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
    page: 1,
    limit: 10
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    role: 'user' as 'user' | 'agent' | 'admin',
    wallet: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      const response = await api.get(`/user?${params}`);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/user/stats');
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/user/register', formData);
      setSuccess('User created successfully');
      setOpenDialog(false);
      setFormData({ phone: '', password: '', role: 'user', wallet: 0 });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleStatusUpdate = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/user/${userId}/status`, { isActive });
      setSuccess(`User ${isActive ? 'activated' : 'blocked'} successfully`);
      fetchUsers();
      fetchStats();
    } catch {
      setError('Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await api.delete(`/user/${selectedUser._id}`);
      setSuccess('User deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch {
      setError('Failed to delete user');
    }
  };

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : prev.page
    }));
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'agent': return 'warning';
      case 'user': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 2, minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            User Management
          </Typography>
          <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
            Manage all users, their roles, and account status
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Section */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1, background: 'linear-gradient(145deg, #2196F3, #21CBF3)', color: 'white' }}>
          <CardContent>
            <People /> Total Users
            <Typography variant="h5">{stats?.totalUsers || 0}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, background: 'linear-gradient(145deg, #4CAF50, #8BC34A)', color: 'white' }}>
          <CardContent>
            <CheckCircle /> Active Users
            <Typography variant="h5">{stats?.activeUsers || 0}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, background: 'linear-gradient(145deg, #F44336, #FF5722)', color: 'white' }}>
          <CardContent>
            <Block /> Blocked Users
            <Typography variant="h5">{stats?.blockedUsers || 0}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, background: 'linear-gradient(145deg, #9C27B0, #E91E63)', color: 'white' }}>
          <CardContent>
            <AccountBalanceWallet /> Total Wallet
            <Typography variant="h5">{stats ? formatCurrency(stats.totalWalletBalance) : formatCurrency(0)}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth size="small" label="Search phone"
              value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select value={filters.role} onChange={(e) => handleFilterChange('role', e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Blocked</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Items</InputLabel>
              <Select value={filters.limit} onChange={(e) => handleFilterChange('limit', e.target.value)}>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={() => setFilters({ role: '', status: '', search: '', page: 1, limit: 10 })}>
              <Refresh /> Reset
            </Button>
            <Button variant="contained" onClick={() => setOpenDialog(true)}>
              <PersonAdd /> Add User
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#3498db' }}>
                  <TableCell sx={{ color: 'white' }}>Phone</TableCell>
                  <TableCell sx={{ color: 'white' }}>Role</TableCell>
                  <TableCell sx={{ color: 'white' }}>Wallet</TableCell>
                  <TableCell sx={{ color: 'white' }}>Earnings</TableCell>
                  <TableCell sx={{ color: 'white' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white' }}>Created</TableCell>
                  <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user._id}>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                    </TableCell>
                    <TableCell>{formatCurrency(user.wallet)}</TableCell>
                    <TableCell>{formatCurrency(user.totalEarnings)}</TableCell>
                    <TableCell>
                      <Chip label={user.isActive ? 'Active' : 'Blocked'} color={user.isActive ? 'success' : 'error'} size="small" />
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleStatusUpdate(user._id, !user.isActive)}>
                        {user.isActive ? <Block /> : <CheckCircle />}
                      </IconButton>
                      <IconButton color="error" onClick={() => { setSelectedUser(user); setOpenDeleteDialog(true); }}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Add User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullScreen={isMobile}>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <TextField label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            <TextField label="Password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as 'user' | 'agent' | 'admin' })}>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Wallet" type="number" value={formData.wallet} onChange={e => setFormData({ ...formData, wallet: parseFloat(e.target.value) || 0 })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>Are you sure to delete {selectedUser?.phone}?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteUser}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersPage;
