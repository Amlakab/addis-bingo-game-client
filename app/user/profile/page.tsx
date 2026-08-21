// app/user/profile/page.jsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import { formatCurrency } from '@/lib/utils';
import { 
  User, 
  Phone, 
  Shield, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  Edit,
  Lock,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import api from '@/app/utils/api';
import Footer from '@/components/ui/Footer';

type UserType = {
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
};

type GameHistory = {
  _id: string;
  winnerId: string;
  winnerCard: number;
  prizePool: number;
  numberOfPlayers: number;
  betAmount: number;
  createdAt: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet'>('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // NEW: Background color state
  const [backgroundColor, setBackgroundColor] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('bingoBgColor');
      return savedColor || 'white';
    }
    return 'white';
  });

  // Color helper functions
  const getTextColor = () => {
    switch(backgroundColor) {
      case 'black': return 'white';
      case 'green': return 'white';
      case 'blue': return 'white';
      case 'yellow': return 'black';
      default: return 'black';
    }
  };

  const getCardBackground = () => {
    switch(backgroundColor) {
      case 'black': return 'rgba(50, 50, 50, 0.95)';
      case 'green': return 'rgba(30, 70, 30, 0.95)';
      case 'blue': return 'rgba(30, 50, 80, 0.95)';
      case 'yellow': return 'rgba(240, 230, 140, 0.95)';
      default: return 'rgba(255, 255, 255, 0.95)';
    }
  };

  // Use useCallback to memoize the showMessage function
  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) return;

        const res = await api.get(`/user/${parsedUser._id}`);
        setUser(res.data.data);
        
        // Fetch game history after user data is loaded
        await fetchGameHistory(res.data.data._id);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchGameHistory = async (userId: string) => {
      try {
        setStatsLoading(true);
        const response = await api.get(`/game/history/user/${userId}`);
        setGameHistory(response.data);
      } catch (error) {
        console.error('Failed to fetch game history:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showMessage('New password must be at least 6 characters long', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await api.put('/user/change-password', {
        userId: user?._id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        showMessage('Password changed successfully!', 'success');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      showMessage(
        error.response?.data?.message || 'Failed to change password', 
        'error'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Calculate statistics from game history
  const calculateStats = () => {
    if (gameHistory.length === 0) {
      return {
        gamesPlayed: 0,
        gamesWon: 0,
        winRate: 0,
        averageEarnings: 0
      };
    }

    const gamesPlayed = gameHistory.length;
    const gamesWon = gameHistory.length;
    const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0;
    
    const totalEarnings = gameHistory
      .reduce((sum, game) => sum + game.prizePool, 0);
    
    const averageEarnings = gamesWon > 0 ? totalEarnings / gamesWon : 0;

    return {
      gamesPlayed,
      gamesWon,
      winRate,
      averageEarnings
    };
  };

  const stats = calculateStats();

  // ✅ If user not found (after loading), show message with navigation
  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20" style={{ backgroundColor: backgroundColor, color: getTextColor() }}>
        <MobileHeader title="Profile" showWallet={false} />
        <div className="flex items-center justify-center h-64">
          <p className="text-center text-gray-500" style={{ color: getTextColor() }}>User not found</p>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  // ✅ Show loading spinner ONLY for content, navigation stays visible
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20" style={{ backgroundColor: backgroundColor, color: getTextColor() }}>
        <MobileHeader title="Profile" showWallet={false} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4" style={{ color: getTextColor() }}>Loading...</p>
          </div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  const ProfileInfo = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="p-6 rounded-lg shadow-md"
      style={{ backgroundColor: getCardBackground(), color: getTextColor() }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center" style={{ color: getTextColor() }}>
          <User className="mr-2 h-5 w-5 text-blue-600" />
          Profile Information
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: backgroundColor === 'white' ? '#f3f4f6' : 'rgba(255,255,255,0.1)' }}>
          <Phone className="h-5 w-5 mr-3" style={{ color: getTextColor() }} />
          <div>
            <p className="text-sm" style={{ color: getTextColor(), opacity: 0.7 }}>Phone Number</p>
            <p className="font-medium" style={{ color: getTextColor() }}>{user!.phone}</p>
          </div>
        </div>

        <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: backgroundColor === 'white' ? '#f3f4f6' : 'rgba(255,255,255,0.1)' }}>
          <Shield className="h-5 w-5 mr-3" style={{ color: getTextColor() }} />
          <div>
            <p className="text-sm" style={{ color: getTextColor(), opacity: 0.7 }}>Account Type</p>
            <p className="font-medium capitalize" style={{ color: getTextColor() }}>{user!.role}</p>
          </div>
        </div>

        <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: backgroundColor === 'white' ? '#f3f4f6' : 'rgba(255,255,255,0.1)' }}>
          <Shield className="h-5 w-5 mr-3" style={{ color: getTextColor() }} />
          <div>
            <p className="text-sm" style={{ color: getTextColor(), opacity: 0.7 }}>Account Status</p>
            <p className="font-medium" style={{ color: getTextColor() }}>{user!.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        <div className="flex items-center p-3 rounded-lg" style={{ backgroundColor: backgroundColor === 'white' ? '#f3f4f6' : 'rgba(255,255,255,0.1)' }}>
          <Calendar className="h-5 w-5 mr-3" style={{ color: getTextColor() }} />
          <div>
            <p className="text-sm" style={{ color: getTextColor(), opacity: 0.7 }}>Member Since</p>
            <p className="font-medium" style={{ color: getTextColor() }}>{new Date(user!.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const WalletSummary = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="p-6 rounded-lg shadow-md"
      style={{ backgroundColor: getCardBackground(), color: getTextColor() }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center" style={{ color: getTextColor() }}>
          <Wallet className="mr-2 h-5 w-5 text-green-600" />
          Wallet Summary
        </h2>
        <CreditCard className="h-5 w-5" style={{ color: getTextColor(), opacity: 0.5 }} />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
          <span style={{ color: '#3b82f6' }}>Current Balance:</span>
          <span className="font-semibold" style={{ color: '#3b82f6' }}>{formatCurrency(user!.wallet || 0)}</span>
        </div>

        <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
          <span style={{ color: '#22c55e' }}>Daily Earnings:</span>
          <span className="font-semibold" style={{ color: '#22c55e' }}>{formatCurrency(user!.dailyEarnings || 0)}</span>
        </div>

        <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)' }}>
          <span style={{ color: '#eab308' }}>Weekly Earnings:</span>
          <span className="font-semibold" style={{ color: '#eab308' }}>{formatCurrency(user!.weeklyEarnings || 0)}</span>
        </div>

        <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
          <span style={{ color: '#a855f7' }}>Total Earnings:</span>
          <span className="font-semibold" style={{ color: '#a855f7' }}>{formatCurrency(user!.totalEarnings || 0)}</span>
        </div>
      </div>
    </motion.div>
  );

  const PasswordChangeModal = () => {
    // Local state for input values to prevent re-renders
    const [localPasswordData, setLocalPasswordData] = useState(passwordData);
    
    const handleLocalChange = (field: string, value: string) => {
      setLocalPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordData(localPasswordData);
      
      // Validate passwords
      if (localPasswordData.newPassword !== localPasswordData.confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
      }
      
      if (localPasswordData.newPassword.length < 6) {
        showMessage('New password must be at least 6 characters long', 'error');
        return;
      }

      setIsChangingPassword(true);
      try {
        const response = await api.put('/user/change-password', {
          userId: user?._id,
          currentPassword: localPasswordData.currentPassword,
          newPassword: localPasswordData.newPassword
        });
        
        if (response.data.success) {
          showMessage('Password changed successfully!', 'success');
          setShowPasswordModal(false);
          setLocalPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }
      } catch (error: any) {
        console.error('Failed to change password:', error);
        showMessage(
          error.response?.data?.message || 'Failed to change password', 
          'error'
        );
      } finally {
        setIsChangingPassword(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="rounded-lg w-full max-w-md" style={{ backgroundColor: getCardBackground(), color: getTextColor() }}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center" style={{ color: getTextColor() }}>
                <Lock className="mr-2 h-5 w-5" />
                Change Password
              </h3>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setLocalPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="hover:opacity-70"
                style={{ color: getTextColor() }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: getTextColor() }}>
                  Current Password
                </label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={localPasswordData.currentPassword}
                    onChange={(e) => handleLocalChange('currentPassword', e.target.value)}
                    className="w-full p-3 border rounded-lg pr-10"
                    style={{ 
                      backgroundColor: backgroundColor === 'white' ? '#fff' : 'rgba(255,255,255,0.1)',
                      borderColor: getTextColor(),
                      color: getTextColor()
                    }}
                    placeholder="Enter current password"
                    required
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3"
                    style={{ color: getTextColor() }}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: getTextColor() }}>
                  New Password
                </label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={localPasswordData.newPassword}
                    onChange={(e) => handleLocalChange('newPassword', e.target.value)}
                    className="w-full p-3 border rounded-lg pr-10"
                    style={{ 
                      backgroundColor: backgroundColor === 'white' ? '#fff' : 'rgba(255,255,255,0.1)',
                      borderColor: getTextColor(),
                      color: getTextColor()
                    }}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3"
                    style={{ color: getTextColor() }}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: getTextColor() }}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={localPasswordData.confirmPassword}
                    onChange={(e) => handleLocalChange('confirmPassword', e.target.value)}
                    className="w-full p-3 border rounded-lg pr-10"
                    style={{ 
                      backgroundColor: backgroundColor === 'white' ? '#fff' : 'rgba(255,255,255,0.1)',
                      borderColor: getTextColor(),
                      color: getTextColor()
                    }}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3"
                    style={{ color: getTextColor() }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setLocalPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="flex-1 py-3 rounded-lg font-medium"
                  style={{ backgroundColor: '#d1d5db', color: '#374151' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#2563eb' }}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: backgroundColor, color: getTextColor() }}>
      <MobileHeader title="Profile" showWallet={false} />
      
      {/* Message Notification */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="p-4 px-0 space-y-6 pb-24 pt-16">
        {/* Tab Navigation */}
        <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: getCardBackground() }}>
          <div className="flex">
            <button 
              className={`flex-1 py-3 text-center font-medium ${activeTab === 'profile' ? 'text-white' : ''}`}
              style={{ 
                backgroundColor: activeTab === 'profile' ? '#2563eb' : 'transparent',
                color: activeTab === 'profile' ? 'white' : getTextColor()
              }}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`flex-1 py-3 text-center font-medium ${activeTab === 'wallet' ? 'text-white' : ''}`}
              style={{ 
                backgroundColor: activeTab === 'wallet' ? '#2563eb' : 'transparent',
                color: activeTab === 'wallet' ? 'white' : getTextColor()
              }}
              onClick={() => setActiveTab('wallet')}
            >
              Wallet
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'profile' && <ProfileInfo key="profile" />}
          {activeTab === 'wallet' && <WalletSummary key="wallet" />}
        </AnimatePresence>

        {/* Performance Overview with Real Data */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="p-6 rounded-lg shadow-md"
          style={{ backgroundColor: getCardBackground(), color: getTextColor() }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center" style={{ color: getTextColor() }}>
            <TrendingUp className="mr-2 h-5 w-5 text-purple-600" />
            Performance Overview
          </h2>
          
          {statsLoading ? (
            <div className="text-center py-8">
              <p style={{ color: getTextColor(), opacity: 0.7 }}>Loading statistics...</p>
            </div>
          ) : gameHistory.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: getTextColor(), opacity: 0.7 }}>No games played yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                <p className="text-sm mb-1" style={{ color: '#3b82f6' }}>Games Played</p>
                <p className="font-semibold" style={{ color: getTextColor() }}>{stats.gamesPlayed}</p>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                <p className="text-sm mb-1" style={{ color: '#22c55e' }}>Games Won</p>
                <p className="font-semibold" style={{ color: getTextColor() }}>{stats.gamesWon}</p>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)' }}>
                <p className="text-sm mb-1" style={{ color: '#eab308' }}>Win Rate</p>
                <p className="font-semibold" style={{ color: getTextColor() }}>{stats.winRate.toFixed(1)}%</p>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
                <p className="text-sm mb-1" style={{ color: '#a855f7' }}>Avg. Earnings</p>
                <p className="font-semibold" style={{ color: getTextColor() }}>{formatCurrency(stats.averageEarnings)}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Games Section */}
        {gameHistory.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            className="p-6 rounded-lg shadow-md"
            style={{ backgroundColor: getCardBackground(), color: getTextColor() }}
          >
            <h2 className="text-xl font-bold mb-4 flex items-center" style={{ color: getTextColor() }}>
              <Calendar className="mr-2 h-5 w-5 text-blue-600" />
              Recent Games
            </h2>
            
            <div className="space-y-3">
              {gameHistory.slice(0, 5).map((game) => (
                <div key={game._id} className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: backgroundColor === 'white' ? '#f3f4f6' : 'rgba(255,255,255,0.05)' }}>
                  <div>
                    <p className="font-medium" style={{ color: getTextColor() }}>Bet: {formatCurrency(game.betAmount)}</p>
                    <p className="text-sm" style={{ color: getTextColor(), opacity: 0.7 }}>
                      {new Date(game.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${game.winnerId === user?._id ? 'text-green-600' : ''}`} style={{ color: game.winnerId === user?._id ? '#22c55e' : getTextColor() }}>
                      {game.winnerId === user?._id ? `Won: ${formatCurrency(game.prizePool)}` : 'Won'}
                    </p>
                    <p className="text-sm" style={{ color: getTextColor(), opacity: 0.7 }}>
                      {game.numberOfPlayers} players
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <MobileNavigation />
      {showPasswordModal && <PasswordChangeModal />}
    </div>
  );
}