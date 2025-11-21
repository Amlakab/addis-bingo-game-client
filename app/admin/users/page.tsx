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
  DialogActions, Button, Collapse, Tabs, Tab
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AccountBalance, People, Block, CheckCircle,
  PersonAdd, Refresh, Delete, Lock, LockOpen,
  AccountBalanceWallet, TrendingUp, EmojiEvents,
  FilterList, ExpandMore, ExpandLess, Visibility,
  Edit
} from '@mui/icons-material';
import api from '@/app/utils/api';

interface User {
  _id: string;
  phone: string;
  role: 'user' | 'disk-user' | 'spinner-user' | 'agent' | 'accountant' | 'admin';
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
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
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
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editTab, setEditTab] = useState<'wallet' | 'password'>('wallet');

  // Form states
  const [formData, setFormData] = useState({
    phone: '',
    tgId: '',
    password: '',
    role: 'user' as 'user' | 'disk-user' | 'spinner-user' | 'agent' | 'accountant' | 'admin',
    wallet: 0
  });

  const [editFormData, setEditFormData] = useState({
    walletAmount: 0,
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [filters.page, filters.limit, filters.role, filters.status, filters.search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add all filters to params
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      console.log('Fetching users with params:', Object.fromEntries(params)); // Debug log

      const response = await api.get(`/user?${params}`);
      console.log('API Response:', response.data); // Debug log
      
      setUsers(response.data.data.users || []);
      setPagination(response.data.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false
      });
      setError('');
    } catch (error: any) {
      console.error('Error fetching users:', error); // Debug log
      setError(error.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        hasNext: false,
        hasPrev: false
      });
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
      setFormData({ phone: '',tgId: '', password: '', role: 'user', wallet: 0 });
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

  const handleUpdateWallet = async () => {
    if (!selectedUser) return;

    try {
      await api.put('/user/update-wallet', {
        userId: selectedUser._id,
        amount: editFormData.walletAmount
      });
      setSuccess('Wallet updated successfully');
      setOpenEditDialog(false);
      setEditFormData({ walletAmount: 0, newPassword: '', confirmPassword: '' });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update wallet');
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser) return;

    if (editFormData.newPassword !== editFormData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await api.put('/user/change-password', {
        userId: selectedUser._id,
        currentPassword: '', // Admin can change password without current password
        newPassword: editFormData.newPassword
      });
      setSuccess('Password updated successfully');
      setOpenEditDialog(false);
      setEditFormData({ walletAmount: 0, newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update password');
    }
  };

  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      walletAmount: 0,
      newPassword: '',
      confirmPassword: ''
    });
    setEditTab('wallet');
    setOpenEditDialog(true);
  };

  const handleFilterChange = (field: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      ...(field !== 'page' && { page: 1 }) // Reset to first page when filters change (except page changes)
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    console.log('Page changing to:', value); // Debug log
    handleFilterChange('page', value);
  };

  const handleFormChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditFormChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
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

  const toggleExpandUser = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
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

  // Debug current state
  useEffect(() => {
    console.log('Current filters:', filters);
    console.log('Current pagination:', pagination);
  }, [filters, pagination]);

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
            User Management
          </Typography>
          <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
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
        <Box sx={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          gap: 2, 
          mb: 3 
        }}>
          {/* Total Users Card */}
          <Card sx={{ 
            flex: 1, 
            background: 'linear-gradient(145deg, #2196F3, #21CBF3)',
            color: 'white', 
            borderRadius: 2,
            boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{ p: 2, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <People sx={{ fontSize: 24, mr: 1 }} />
                <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium' }}>
                  Total Users
                </Typography>
              </Box>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                {stats?.totalUsers || 0}
              </Typography>
            </CardContent>
          </Card>

          {/* Active Users Card */}
          <Card sx={{ 
            flex: 1, 
            background: 'linear-gradient(145deg, #4CAF50, #8BC34A)',
            color: 'white', 
            borderRadius: 2,
            boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{ p: 2, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ fontSize: 24, mr: 1 }} />
                <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium' }}>
                  Active Users
                </Typography>
              </Box>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                {stats?.activeUsers || 0}
              </Typography>
            </CardContent>
          </Card>

          {/* Blocked Users Card */}
          <Card sx={{ 
            flex: 1, 
            background: 'linear-gradient(145deg, #F44336, #FF5722)',
            color: 'white', 
            borderRadius: 2,
            boxShadow: '0 4px 8px rgba(244, 67, 54, 0.3)',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{ p: 2, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Block sx={{ fontSize: 24, mr: 1 }} />
                <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium' }}>
                  Blocked Users
                </Typography>
              </Box>
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold' }}>
                {stats?.blockedUsers || 0}
              </Typography>
            </CardContent>
          </Card>

          {/* Total Wallet Card */}
          <Card sx={{ 
            flex: 1, 
            background: 'linear-gradient(145deg, #9C27B0, #E91E63)',
            color: 'white', 
            borderRadius: 2,
            boxShadow: '0 4px 8px rgba(156, 39, 176, 0.3)',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <CardContent sx={{ p: 2, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccountBalanceWallet sx={{ fontSize: 24, mr: 1 }} />
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
      </motion.div>

      {/* Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterList sx={{ mr: 1 }} /> User Filters
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ display: { sm: 'none' } }}
                  size="small"
                >
                  {showFilters ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={resetFilters}
                  size="small"
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setOpenDialog(true)}
                  size="small"
                >
                  {isMobile ? 'Add' : 'Add User'}
                </Button>
              </Box>
            </Box>
            
            <Collapse in={showFilters || !isMobile}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search by phone"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Enter phone number..."
                />

                <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2 }}>
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
                      <MenuItem value="accountant">Accountant</MenuItem>
                      <MenuItem value="spinner-user">Spinner User</MenuItem>
                      <MenuItem value="desktop-user">Desktop User</MenuItem>
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
                </Box>

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

                {isMobile && (
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={resetFilters}
                    size="small"
                    fullWidth
                  >
                    Reset Filters
                  </Button>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users List */}
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
              {users.map((user) => {
                const isExpanded = expandedUser === user._id;
                
                return (
                  <Card key={user._id} sx={{ borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {user.phone}
                          </Typography>
                          <Chip
                            label={user.role}
                            color={getRoleColor(user.role)}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        <IconButton 
                          size="small" 
                          onClick={() => toggleExpandUser(user._id)}
                          sx={{ p: 0 }}
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Status:</Typography>
                        <Chip
                          label={user.isActive ? 'Active' : 'Blocked'}
                          color={user.isActive ? 'success' : 'error'}
                          size="small"
                          sx={{ height: 24 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Wallet:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {formatCurrency(user.wallet)}
                        </Typography>
                      </Box>

                      {isExpanded && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Earnings:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                              {formatCurrency(user.totalEarnings)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Created:</Typography>
                            <Typography variant="body2">
                              {formatDate(user.createdAt)}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenEditDialog(user)}
                              size="small"
                            >
                              <Edit />
                            </IconButton>
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
            <Card sx={{ borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: 'linear-gradient(145deg, #3498db, #2980b9)' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Phone</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Role</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Wallet</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Earnings</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Created</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Actions</TableCell>
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
                                color="primary"
                                onClick={() => handleOpenEditDialog(user)}
                                size="small"
                              >
                                <Edit />
                              </IconButton>
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
          )}

          {/* Paginationnn */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={pagination.totalPages}
                page={filters.page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Pagination Info */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.totalUsers)} of {pagination.totalUsers} users
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Page {filters.page} of {pagination.totalPages}
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Add User Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
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
              label="Telegram Id"
              value={formData.tgId}
              onChange={(e) => handleFormChange('tgId', e.target.value)}
              placeholder="@XXXXXXXX"
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
                onChange={(e) => handleFormChange('role', e.target.value as 'user' | 'disk-user' | 'agent' | 'admin')}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="disk-user">Disktop User</MenuItem>
                <MenuItem value="spinner-user">Spinner User</MenuItem>
                <MenuItem value="accountant">Accountant</MenuItem>
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

      {/* Edit User Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Edit User - {selectedUser?.phone}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Tabs
              value={editTab}
              onChange={(_, newValue) => setEditTab(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab 
                icon={<AccountBalanceWallet />} 
                label="Wallet" 
                value="wallet" 
                sx={{ minWidth: 'auto' }}
              />
              <Tab 
                icon={<Lock />} 
                label="Password" 
                value="password" 
                sx={{ minWidth: 'auto' }}
              />
            </Tabs>

            {editTab === 'wallet' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Current Wallet: {formatCurrency(selectedUser?.wallet || 0)}
                </Typography>
                <TextField
                  fullWidth
                  label="Wallet Amount"
                  type="number"
                  value={editFormData.walletAmount}
                  onChange={(e) => handleEditFormChange('walletAmount', parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount to add/subtract"
                  helperText="Positive number to add, negative number to subtract"
                  inputProps={{ step: "0.01" }}
                />
              </Box>
            )}

            {editTab === 'password' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  value={editFormData.newPassword}
                  onChange={(e) => handleEditFormChange('newPassword', e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={editFormData.confirmPassword}
                  onChange={(e) => handleEditFormChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={editTab === 'wallet' ? handleUpdateWallet : handleUpdatePassword}
            variant="contained"
            disabled={
              editTab === 'wallet' ? editFormData.walletAmount === 0 :
              editTab === 'password' ? !editFormData.newPassword || !editFormData.confirmPassword
              : true
            }
          >
            {editTab === 'wallet' ? 'Update Wallet' : 'Update Password'}
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
};

export default UsersPage;