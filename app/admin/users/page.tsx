'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  Chip, Alert, Snackbar, CircularProgress,
  useTheme, useMediaQuery, Pagination,
  MenuItem, Select, FormControl, InputLabel,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Button
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AccountBalance, People, Block, CheckCircle,
  PersonAdd, Refresh, Delete, Lock, LockOpen,
  AccountBalanceWallet, TrendingUp, EmojiEvents
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

  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
    page: 1,
    limit: 10
  });

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
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
    } catch (error: any) {
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
    } catch (error: any) {
      setError('Failed to delete user');
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

  const handleFormChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      role: '',
      status: '',
      search: '',
      page: 1,
      limit: 10
    });
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
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'agent': return 'warning';
      case 'user': return 'primary';
      default: return 'default';
    }
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
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all users, their roles, and account status
          </Typography>
        </Box>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
          {/* Total Users Card */}
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 23%' }, display: 'flex' }}>
            <Card sx={{ 
              flex: 1, 
              background: 'linear-gradient(145deg, #2196F3, #21CBF3)',
              color: 'white', 
              borderRadius: 3,
              boxShadow: '0 8px 16px rgba(33, 150, 243, 0.3)',
              minHeight: { xs: '120px', sm: '140px' },
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <People sx={{ fontSize: { xs: 20, sm: 24 }, mr: 1 }} />
                  <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium' }}>
                    Total Users
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                  {stats?.totalUsers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Active Users Card */}
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 23%' }, display: 'flex' }}>
            <Card sx={{ 
              flex: 1, 
              background: 'linear-gradient(145deg, #4CAF50, #8BC34A)',
              color: 'white', 
              borderRadius: 3,
              boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)',
              minHeight: { xs: '120px', sm: '140px' },
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ fontSize: { xs: 20, sm: 24 }, mr: 1 }} />
                  <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium' }}>
                    Active Users
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                  {stats?.activeUsers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Blocked Users Card */}
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 23%' }, display: 'flex' }}>
            <Card sx={{ 
              flex: 1, 
              background: 'linear-gradient(145deg, #F44336, #FF5722)',
              color: 'white', 
              borderRadius: 3,
              boxShadow: '0 8px 16px rgba(244, 67, 54, 0.3)',
              minHeight: { xs: '120px', sm: '140px' },
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Block sx={{ fontSize: { xs: 20, sm: 24 }, mr: 1 }} />
                  <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium' }}>
                    Blocked Users
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                  {stats?.blockedUsers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Total Wallet Card */}
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 48%', md: '1 1 23%' }, display: 'flex' }}>
            <Card sx={{ 
              flex: 1, 
              background: 'linear-gradient(145deg, #9C27B0, #E91E63)',
              color: 'white', 
              borderRadius: 3,
              boxShadow: '0 8px 16px rgba(156, 39, 176, 0.3)',
              minHeight: { xs: '120px', sm: '140px' },
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountBalanceWallet sx={{ fontSize: { xs: 20, sm: 24 }, mr: 1 }} />
                  <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium' }}>
                    Total Wallet
                  </Typography>
                </Box>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                  {stats ? formatCurrency(stats.totalWalletBalance) : formatCurrency(0)}
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ mr: 1 }} /> User Filters
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={resetFilters}
                  size="small"
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setOpenDialog(true)}
                  size="small"
                >
                  Add User
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2,
              '& > *': { 
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 16px)', md: '1 1 calc(25% - 16px)' },
                minWidth: { xs: '100%', sm: '200px' }
              } 
            }}>
              <TextField
                fullWidth
                size="small"
                label="Search by phone"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Enter phone number..."
              />

              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filters.role}
                  label="Role"
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="agent">Agent</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Blocked</MenuItem>
                </Select>
              </FormControl>

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

      {/* Users Table */}
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
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Wallet</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Earnings</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {user.phone}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {formatCurrency(user.wallet)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                            {formatCurrency(user.totalEarnings)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Active' : 'Blocked'}
                            color={user.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(user.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              color={user.isActive ? 'error' : 'success'}
                              onClick={() => handleStatusUpdate(user._id, !user.isActive)}
                              size="small"
                            >
                              {user.isActive ? <Block /> : <CheckCircle />}
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => {
                                setSelectedUser(user);
                                setOpenDeleteDialog(true);
                              }}
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {users.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    No users found. {filters.role || filters.status ? 'Try changing your filters.' : 'No users registered yet.'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={filters.page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}

          {/* Pagination Info */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {users.length} of {pagination.totalUsers} users
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Add User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
              placeholder="09XXXXXXXX"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => handleFormChange('password', e.target.value)}
              placeholder="Enter password"
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={(e) => handleFormChange('role', e.target.value as 'user' | 'agent' | 'admin')}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="agent">Agent</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Initial Wallet Balance"
              type="number"
              value={formData.wallet}
              onChange={(e) => handleFormChange('wallet', parseFloat(e.target.value) || 0)}
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained" 
            disabled={!formData.phone || !formData.password}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user {selectedUser?.phone}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
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
};

export default UsersPage;