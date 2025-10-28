'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, Plus, Wallet, Calendar, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/app/utils/api';

// ✅ Define User type
type UserType = {
  _id: string;
  phone: string;
  password?: string;
  role: 'user' | 'disk-user' | 'spinner-user' | 'agent' |'accountant' | 'admin';
  wallet: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function UserDashboard() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(authUser || null);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch full user from backend
  useEffect(() => {
    const fetchUser = async () => {
      if (typeof window === "undefined") return;

      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) return;

        const response = await api.get(`/user/${parsedUser._id}`);
        const userData: UserType = response.data.data || response.data;
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8 text-red-600">User not found</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Wallet</h1>
      
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user.phone}!</h2>
        <p className="text-gray-600">Manage your wallet and track your earnings</p>
      </motion.div>

      {/* Main Wallet Balance */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-xl font-bold">Wallet Balance</h3>
            <Wallet className="h-6 w-6 text-blue-200" />
          </div>
          
          <div className="text-center mb-6">
            <p className="text-blue-100 text-sm mb-2">Available Balance</p>
            <p className="text-4xl font-bold">{formatCurrency(user.wallet || 0)}</p>
          </div>

          <button
            className="w-full bg-white text-blue-600 hover:bg-gray-100 py-3 rounded-md font-medium flex items-center justify-center transition-colors"
            onClick={() => router.push('/user/wallet')}
          >
            <Plus className="h-5 w-5 mr-2" /> Add Funds
          </button>
        </div>
      </motion.div>

      {/* Earnings Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      >
        {/* Total Earnings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Total Earnings</h4>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(user.totalEarnings || 0)}
          </p>
          <p className="text-sm text-gray-600">All-time earnings from games</p>
        </div>

        {/* Daily Earnings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Today's Earnings</h4>
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(user.dailyEarnings || 0)}
          </p>
          <p className="text-sm text-gray-600">Earnings for today</p>
        </div>

        {/* Weekly Earnings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Weekly Earnings</h4>
            <Clock className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-2">
            {formatCurrency(user.weeklyEarnings || 0)}
          </p>
          <p className="text-sm text-gray-600">Earnings this week</p>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/user/wallet/deposit')}
            className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-5 w-5 mr-3 text-green-500" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Deposit Funds</p>
              <p className="text-sm text-gray-600">Add money to your wallet</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/user/wallet/withdraw')}
            className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DollarSign className="h-5 w-5 mr-3 text-blue-500" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Withdraw Funds</p>
              <p className="text-sm text-gray-600">Transfer to your account</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Account Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Member Since</span>
            <span className="font-medium text-gray-900">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Account Status</span>
            <span className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {user.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">User Role</span>
            <span className="font-medium text-gray-900 capitalize">
              {user.role.replace('-', ' ')}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Phone Number</span>
            <span className="font-medium text-gray-900">{user.phone}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}