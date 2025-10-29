'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  ArrowLeft
} from 'lucide-react';
import api from '@/app/utils/api';
import MobileHeader from '@/components/sub-agent/MobileHeader';
import MobileNavigation from '@/components/sub-agent/MobileNavigation';
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

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <MobileHeader title="Profile" />
        <div className="flex items-center justify-center h-screen w-full pt-16 pb-16">
          <p className="text-center text-gray-500">User not found</p>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <MobileHeader title="Profile" />
        <div className="flex items-center justify-center h-screen w-full pt-16 pb-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  const ProfileInfo = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white p-4 rounded-lg shadow-sm w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <User className="mr-2 h-5 w-5 text-blue-600" />
          Profile Information
        </h2>
        <button 
          className="p-2 text-blue-600 rounded-full hover:bg-blue-50"
          onClick={() => setShowPasswordModal(true)}
        >
          <Edit className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Phone className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Phone Number</p>
            <p className="font-medium text-sm">{user!.phone}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Shield className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Account Type</p>
            <p className="font-medium text-sm capitalize">{user!.role}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Shield className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Account Status</p>
            <p className={`font-medium text-sm ${user!.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {user!.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Calendar className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="font-medium text-sm">{new Date(user!.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const WalletSummary = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white p-4 rounded-lg shadow-sm w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Wallet className="mr-2 h-5 w-5 text-green-600" />
          Wallet Summary
        </h2>
        <CreditCard className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-blue-700 text-sm">Current Balance:</span>
          <span className="font-semibold text-blue-700 text-sm">{formatCurrency(user!.wallet || 0)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <span className="text-green-700 text-sm">Daily Earnings:</span>
          <span className="font-semibold text-green-700 text-sm">{formatCurrency(user!.dailyEarnings || 0)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
          <span className="text-yellow-700 text-sm">Weekly Earnings:</span>
          <span className="font-semibold text-yellow-700 text-sm">{formatCurrency(user!.weeklyEarnings || 0)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
          <span className="text-purple-700 text-sm">Total Earnings:</span>
          <span className="font-semibold text-purple-700 text-sm">{formatCurrency(user!.totalEarnings || 0)}</span>
        </div>
      </div>
    </motion.div>
  );

  const PasswordChangeModal = () => {
    const handleSubmit = async (e: React.FormEvent) => {
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

    const handleChange = (field: keyof typeof passwordData, value: string) => {
      setPasswordData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
      if (field === 'current') setShowCurrentPassword(!showCurrentPassword);
      if (field === 'new') setShowNewPassword(!showNewPassword);
      if (field === 'confirm') setShowConfirmPassword(!showConfirmPassword);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                Change Password
              </h3>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={passwordData.currentPassword}
                    onChange={(e) => handleChange('currentPassword', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg pr-10 text-sm"
                    placeholder="Enter current password"
                    required
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3 text-gray-500"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={passwordData.newPassword}
                    onChange={(e) => handleChange('newPassword', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg pr-10 text-sm"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3 text-gray-500"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={passwordData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg pr-10 text-sm"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3 text-gray-500"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium text-sm disabled:opacity-50"
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
    <div className="min-h-screen bg-gray-50 w-full">
      <MobileHeader title="Profile" />
      
      {/* Message Notification */}
      {message && (
        <div className={`fixed top-16 left-4 right-4 z-50 p-3 rounded-lg shadow-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="text-sm text-center">{message.text}</p>
        </div>
      )}
      
      <main className="px-4 pb-24 pt-16 w-full max-w-full mx-auto overflow-x-hidden">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
          <div className="flex">
            <button 
              className={`flex-1 py-3 text-center font-medium text-sm ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`flex-1 py-3 text-center font-medium text-sm ${activeTab === 'wallet' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
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
          className="bg-white p-4 rounded-lg shadow-sm mt-4 w-full"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-purple-600" />
            Performance Overview
          </h2>
          
          {statsLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">Loading statistics...</p>
            </div>
          ) : gameHistory.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">No games played yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-xs text-blue-600 mb-1">Games Played</p>
                <p className="font-semibold text-sm">{stats.gamesPlayed}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-xs text-green-600 mb-1">Games Won</p>
                <p className="font-semibold text-sm">{stats.gamesWon}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <p className="text-xs text-yellow-600 mb-1">Win Rate</p>
                <p className="font-semibold text-sm">{stats.winRate.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <p className="text-xs text-purple-600 mb-1">Avg. Earnings</p>
                <p className="font-semibold text-sm">{formatCurrency(stats.averageEarnings)}</p>
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
            className="bg-white p-4 rounded-lg shadow-sm mt-4 w-full"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-600" />
              Recent Games
            </h2>
            
            <div className="space-y-3">
              {gameHistory.slice(0, 5).map((game) => (
                <div key={game._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Bet: {formatCurrency(game.betAmount)}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 text-sm">
                      {game.winnerId === user?._id ? `Won: ${formatCurrency(game.prizePool)}` : 'Won'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {game.numberOfPlayers} players
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* <Footer /> */}
      {showPasswordModal && <PasswordChangeModal />}
      <MobileNavigation />
    </div>
  );
}