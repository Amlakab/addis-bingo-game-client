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

  if (!user && !isLoading) return <p className="text-center mt-10 text-gray-500">User not found</p>;
  if (isLoading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  const ProfileInfo = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center">
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

      <div className="space-y-4">
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Phone className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Phone Number</p>
            <p className="font-medium">{user!.phone}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Shield className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Account Type</p>
            <p className="font-medium capitalize">{user!.role}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Shield className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Account Status</p>
            <p className="font-medium">{user!.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Calendar className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="font-medium">{new Date(user!.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const WalletSummary = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <Wallet className="mr-2 h-5 w-5 text-green-600" />
          Wallet Summary
        </h2>
        <CreditCard className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-blue-700">Current Balance:</span>
          <span className="font-semibold text-blue-700">{formatCurrency(user!.wallet || 0)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <span className="text-green-700">Daily Earnings:</span>
          <span className="font-semibold text-green-700">{formatCurrency(user!.dailyEarnings || 0)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
          <span className="text-yellow-700">Weekly Earnings:</span>
          <span className="font-semibold text-yellow-700">{formatCurrency(user!.weeklyEarnings || 0)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
          <span className="text-purple-700">Total Earnings:</span>
          <span className="font-semibold text-purple-700">{formatCurrency(user!.totalEarnings || 0)}</span>
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
        <div className="bg-white rounded-lg w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center">
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
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
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
                    value={localPasswordData.currentPassword}
                    onChange={(e) => handleLocalChange('currentPassword', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg pr-10"
                    placeholder="Enter current password"
                    required
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3 text-gray-500"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    value={localPasswordData.newPassword}
                    onChange={(e) => handleLocalChange('newPassword', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg pr-10"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3 text-gray-500"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    value={localPasswordData.confirmPassword}
                    onChange={(e) => handleLocalChange('confirmPassword', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg pr-10"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-3 text-gray-500"
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
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
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
    <div className="min-h-screen bg-gray-50 pb-20">
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex">
            <button 
              className={`flex-1 py-3 text-center font-medium ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`flex-1 py-3 text-center font-medium ${activeTab === 'wallet' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
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
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-purple-600" />
            Performance Overview
          </h2>
          
          {statsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading statistics...</p>
            </div>
          ) : gameHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No games played yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-600 mb-1">Games Played</p>
                <p className="font-semibold">{stats.gamesPlayed}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-green-600 mb-1">Games Won</p>
                <p className="font-semibold">{stats.gamesWon}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p className="text-sm text-yellow-600 mb-1">Win Rate</p>
                <p className="font-semibold">{stats.winRate.toFixed(1)}%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-purple-600 mb-1">Avg. Earnings</p>
                <p className="font-semibold">{formatCurrency(stats.averageEarnings)}</p>
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
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-600" />
              Recent Games
            </h2>
            
            <div className="space-y-3">
              {gameHistory.slice(0, 5).map((game) => (
                <div key={game._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Bet: {formatCurrency(game.betAmount)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(game.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold 'text-green-600' : 'text-green-600'}`}>
                      {game.winnerId === user?._id ? `Won: ${formatCurrency(game.prizePool)}` : 'Won'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {game.numberOfPlayers} players
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <Footer />

      <MobileNavigation />
      {showPasswordModal && <PasswordChangeModal />}
    </div>
  );
}