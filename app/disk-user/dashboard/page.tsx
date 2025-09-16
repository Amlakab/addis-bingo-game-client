'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import { Wallet, BarChart3, Activity, PiggyBank, PlusCircle, LogOut } from 'lucide-react';
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
  Divider
} from '@mui/material';

// ✅ Define User type
type UserType = {
  _id: string;
  phone: string;
  role: 'user' |'disk-user' | 'agent' | 'admin';
  wallet: number;
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
                  onClick={() => setShowWalletDialog(true)}
                  startIcon={<PlusCircle />}
                >
                  Manage Wallet
                </Button>
                {showSuccess && (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: 3 }}>
                    Wallet balance updated!
                  </Alert>
                )}
              </Card>
            </motion.div>

            {/* User Wallet */}
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
                  p: 4
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <PiggyBank className="h-7 w-7 text-pink-500" />
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Your Wallet
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <div>
                    <Typography color="text.secondary">Balance</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(user.wallet)}
                    </Typography>
                  </div>
                  <div>
                    <Typography color="text.secondary">Total Earnings</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(user.totalEarnings)}
                    </Typography>
                  </div>
                  <div>
                    <Typography color="text.secondary">Daily</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(user.dailyEarnings)}
                    </Typography>
                  </div>
                  <div>
                    <Typography color="text.secondary">Weekly</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(user.weeklyEarnings)}
                    </Typography>
                  </div>
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

          {/* Logout */}
          {/* <Box sx={{ mt: 6, textAlign: 'right' }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              sx={{ borderRadius: 3, px: 4 }}
              startIcon={<LogOut />}
              onClick={logout}
            >
              Logout
            </Button>
          </Box> */}
        </Box>

        {/* Wallet Dialog (Bigger for desktop) */}
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