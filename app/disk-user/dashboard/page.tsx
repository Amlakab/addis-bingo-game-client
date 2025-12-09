'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import { Wallet, BarChart3, Activity, PiggyBank, PlusCircle, LogOut, ArrowUpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/app/utils/api';
import axios from 'axios';
import MobileHeader from '@/components/disk-user/MobileHeader';
import MobileNavigation from '@/components/disk-user/MobileNavigation';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';

// ✅ Define User type
type UserType = {
  _id: string;
  phone: string;
  role: 'user' |'disk-user' |'spinner-user' | 'agent' | 'accountant' | 'admin';
  wallet: number;
  remainingWallet: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ✅ Define System Stats type
interface SystemStats {
  walletBalance: number;
  earningsPercentage: number;
}

export default function UserDashboard() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(authUser || null);
  const [loading, setLoading] = useState(true);

  const [systemStats, setSystemStats] = useState<SystemStats>({
    walletBalance: 0,
    earningsPercentage: 20
  });
  const [userWallet, setUserWallet] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showOnlineTransferDialog, setShowOnlineTransferDialog] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const fetchUser = async () => {
      if (typeof window === 'undefined') return;
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) return;

        const response = await api.get(`/user/${parsedUser._id}`);
        const userData: UserType = response.data.data || response.data;
        setUser(userData);
        setUserWallet(userData.wallet || 0);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/user/system-stats`);
      setSystemStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  // Add this function at the top with other utility functions
const formatDateDisplay = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if it's today
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString('en-ET', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`;
  }
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString('en-ET', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`;
  }
  
  // Otherwise show full date
  return `${date.toLocaleDateString('en-ET', { 
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })} at ${date.toLocaleTimeString('en-ET', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })}`;
};

  const openTransferToSystemDialog = async () => {

    try {
      const response = await axios.get(`${BASE_URL}/user/system-stats`);
      setSystemStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }

     try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) return;

        const response = await api.get(`/user/${parsedUser._id}`);
        const userData: UserType = response.data.data || response.data;
        setUser(userData);
        setUserWallet(userData.wallet || 0);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }

    setShowWalletDialog(true);
  };

  const openTransferToOnlineDialog = async () => {

    try {
      const response = await axios.get(`${BASE_URL}/user/system-stats`);
      setSystemStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }

     try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) return;

        const response = await api.get(`/user/${parsedUser._id}`);
        const userData: UserType = response.data.data || response.data;
        setUser(userData);
        setUserWallet(userData.wallet || 0);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }

    setShowOnlineTransferDialog(true);

  };

  const handleSaveWallet = async () => {
    try {
      const newWalletBalance = systemStats.walletBalance + userWallet;
      
      // Update system wallet
      await axios.put(`${BASE_URL}/user/system-stats`, {
        walletBalance: newWalletBalance,
        earningsPercentage: systemStats.earningsPercentage
      });
      
      // Update user wallet to 0
      await api.put('/user/update-wallet', {
        userId: user?._id,
        amount: 0 // Subtract the entire amount to make it 0
      });
      
      // Update local state
      setSystemStats(prev => ({ ...prev, walletBalance: newWalletBalance }));
      setUserWallet(0);
      setUser(prev => prev ? { ...prev, wallet: 0 } : null);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowWalletDialog(false);
      router.refresh();
      
    } catch (error) {
      console.error('Error updating wallet:', error);
    }
  };

  // ✅ New Function: Handle Transfer to Online
  const handleTransferToOnline = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setTransferError('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount > systemStats.walletBalance) {
      setTransferError('Amount exceeds available balance');
      return;
    }

    setTransferLoading(true);
    setTransferError('');
    setTransferSuccess('');

    try {
      // Calculate new balances
      const newSystemBalance = systemStats.walletBalance - amount;
      const newUserBalance = userWallet + amount;

      // Update system wallet (deduct amount)
      await axios.put(`${BASE_URL}/user/system-stats`, {
        walletBalance: newSystemBalance,
        earningsPercentage: systemStats.earningsPercentage
      });

      // Update user wallet (add amount)
      await api.put('/user/update-wallet', {
        userId: user?._id,
        amount: amount
      });

      // Update local state
      setSystemStats(prev => ({ ...prev, walletBalance: newSystemBalance }));
      setUserWallet(newUserBalance);
      setUser(prev => prev ? { ...prev, wallet: newUserBalance } : null);

      // Show success and reset
      setTransferSuccess(`Successfully transferred ${formatCurrency(amount)} to your online wallet!`);
      setTransferAmount('');
      
      setTimeout(() => {
        setShowOnlineTransferDialog(false);
        setTransferSuccess('');
      }, 2000);

      router.refresh();
    } catch (error) {
      console.error('Error transferring to online wallet:', error);
      setTransferError('Failed to transfer funds. Please try again.');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleTransferAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTransferAmount(value);
      setTransferError('');
    }
  };

  const calculateNewBalances = () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      return {
        newSystemBalance: systemStats.walletBalance,
        newUserBalance: userWallet
      };
    }

    const amount = parseFloat(transferAmount);
    return {
      newSystemBalance: systemStats.walletBalance - amount,
      newUserBalance: userWallet + amount
    };
  };

  const { newSystemBalance, newUserBalance } = calculateNewBalances();

  if (!user) return null;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200">
        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <MobileHeader title="Dashboard" />
      <main className="px-4 px-0 pb-24 pt-16 w-full max-w-full mx-auto overflow-x-hidden">

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <Box sx={{ p: 6, maxWidth: '1400px', mx: 'auto' }}>
          {/* Title */}
          <Typography
            variant="h2"
            sx={{
              color: '#1e3a8a',
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 6,
              fontFamily: 'Poppins, sans-serif',
              letterSpacing: 1
            }}
          >
            🎯 User Dashboard
          </Typography>

          {/* Desktop layout grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* System Wallet */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card
                sx={{
                  borderRadius: 4,
                  background:
                    'linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(147,51,234,0.9) 100%)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                  p: 4,
                  color: 'white'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Wallet className="h-7 w-7" />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    System Wallet
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Current Balance: <b>{formatCurrency(systemStats.walletBalance)}</b>
                </Typography>
                <Typography variant="body1">
                  Earnings %: <b>{systemStats.earningsPercentage}%</b>
                </Typography>
                
                {/* Existing Button */}
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 3,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 'bold',
                    background: 'white',
                    color: '#1e40af',
                    '&:hover': { background: '#f3f4f6' }
                  }}
                  onClick={openTransferToSystemDialog}
                  startIcon={<PlusCircle />}
                >
                  Transfer to System Wallet
                </Button>

                {/* ✅ New Button: Transfer to Online */}
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 'bold',
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': { 
                      borderColor: 'white',
                      background: 'rgba(255,255,255,0.1)'
                    },
                    '&:disabled': {
                      borderColor: 'rgba(255,255,255,0.3)',
                      color: 'rgba(255,255,255,0.5)'
                    }
                  }}
                  onClick={openTransferToOnlineDialog}
                  disabled={systemStats.walletBalance <= 0}
                  startIcon={<ArrowUpCircle />}
                >
                  Transfer to Online
                </Button>

                {showSuccess && (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: 3 }}>
                    Wallet balance updated!
                  </Alert>
                )}
              </Card>
            </motion.div>

            {/* UPDATED: User Wallet Card to match WalletDashboard format */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card
                sx={{
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.1)',
                  p: 4,
                  height: '100%'
                }}
              >
                {/* Current Balance (user.wallet) at top in bold */}
                <Box sx={{ textAlign: 'center', mb: 3, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="h4" fontWeight="bold" sx={{ 
                    background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent'
                  }}>
                    {formatCurrency(user.wallet)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" fontWeight="medium">
                    Current Balance
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PiggyBank className="h-7 w-7 text-pink-500" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', ml: 1 }}>
                    Wallet Details
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Box sx={{ flex: '1 1 45%', minWidth: 120 }}>
                    <Typography variant="body2" color="text.secondary">
                      Remaining Wallet
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {formatCurrency(user.remainingWallet || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: 120 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Earnings
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                      {formatCurrency(user.totalEarnings)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: 120 }}>
                    <Typography variant="body2" color="text.secondary">
                      Daily
                    </Typography>
                    <Typography variant="h6" fontWeight="medium" color="text.primary">
                      {formatCurrency(user.dailyEarnings)}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: 120 }}>
                    <Typography variant="body2" color="text.secondary">
                      Weekly
                    </Typography>
                    <Typography variant="h6" fontWeight="medium" color="text.primary">
                      {formatCurrency(user.weeklyEarnings)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Account Status:
                    </Typography>
                    <Typography variant="body2" color={user.isActive ? 'success.main' : 'error.main'} fontWeight="bold">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated:
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {formatDateDisplay(user.updatedAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Member since:
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-6 mt-8"
          >
            <Card className="p-6 text-center shadow-lg rounded-3xl">
              <BarChart3 className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Games Played</p>
            </Card>
            <Card className="p-6 text-center shadow-lg rounded-3xl">
              <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Active Sessions</p>
            </Card>
            <Card className="p-6 text-center shadow-lg rounded-3xl">
              <PiggyBank className="h-8 w-8 text-pink-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">0%</p>
              <p className="text-sm text-gray-600">Win Rate</p>
            </Card>
          </motion.div>
        </Box>

        {/* ✅ New Dialog: Transfer to Online */}
        <Dialog
          open={showOnlineTransferDialog}
          onClose={() => !transferLoading && setShowOnlineTransferDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              p: 3,
              background: 'linear-gradient(135deg, #f3f4f6, #ffffff)'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.5rem', textAlign: 'center' }}>
            💸 Transfer to Online Wallet
          </DialogTitle>
          <DialogContent>
            {transferSuccess ? (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>
                {transferSuccess}
              </Alert>
            ) : (
              <>
                <Typography sx={{ mb: 3, textAlign: 'center' }}>
                  Transfer funds from System Wallet to your Online Wallet
                </Typography>

                {/* Current Balances */}
                <Box sx={{ mb: 3, p: 2, background: 'rgba(59,130,246,0.1)', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current System Wallet: <b>{formatCurrency(systemStats.walletBalance)}</b>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Online Wallet: <b>{formatCurrency(userWallet)}</b>
                  </Typography>
                </Box>

                {/* Amount Input */}
                <TextField
                  fullWidth
                  label="Transfer Amount"
                  type="text"
                  value={transferAmount}
                  onChange={handleTransferAmountChange}
                  disabled={transferLoading}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                  placeholder="Enter amount"
                  error={!!transferError}
                  helperText={transferError}
                  sx={{ mb: 3 }}
                />

                {/* Balance Preview */}
                {transferAmount && parseFloat(transferAmount) > 0 && (
                  <Box sx={{ mb: 2, p: 2, background: 'rgba(34,197,94,0.1)', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                      After Transfer:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New System Wallet: <b>{formatCurrency(newSystemBalance)}</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New Online Wallet: <b>{formatCurrency(newUserBalance)}</b>
                    </Typography>
                  </Box>
                )}

                {transferError && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
                    {transferError}
                  </Alert>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
            <Button 
              onClick={() => setShowOnlineTransferDialog(false)} 
              variant="outlined" 
              sx={{ borderRadius: 3 }}
              disabled={transferLoading}
            >
              {transferSuccess ? 'Close' : 'Cancel'}
            </Button>
            {!transferSuccess && (
              <Button 
                onClick={handleTransferToOnline} 
                variant="contained" 
                sx={{ borderRadius: 3 }}
                disabled={
                  transferLoading || 
                  !transferAmount || 
                  parseFloat(transferAmount) <= 0 ||
                  parseFloat(transferAmount) > systemStats.walletBalance
                }
                startIcon={<ArrowUpCircle />}
              >
                {transferLoading ? 'Transferring...' : 'Transfer Funds'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Existing Wallet Dialog */}
        <Dialog
          open={showWalletDialog}
          onClose={() => setShowWalletDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              p: 3,
              background: 'linear-gradient(135deg, #f3f4f6, #ffffff)'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.5rem', textAlign: 'center' }}>
            💳 Wallet Management
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Your Wallet: <b>{formatCurrency(userWallet)}</b>
            </Typography>
            <Typography sx={{ mb: 2 }}>
              System Wallet: <b>{formatCurrency(systemStats.walletBalance)}</b>
            </Typography>
            <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem', mt: 2 }}>
              New System Balance:{' '}
              {formatCurrency(systemStats.walletBalance + userWallet)}
            </Typography>
            <Typography sx={{ color: 'text.secondary', mt: 2, fontStyle: 'italic' }}>
              After transfer, your wallet will be reset to 0.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between', px: 4, pb: 3 }}>
            <Button onClick={() => setShowWalletDialog(false)} variant="outlined" sx={{ borderRadius: 3 }}>
              Cancel
            </Button>
            <Button onClick={handleSaveWallet} variant="contained" sx={{ borderRadius: 3 }}>
              Transfer & Reset Wallet
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
      </main>
      <MobileNavigation />
    </div>
  );
}