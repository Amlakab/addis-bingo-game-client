'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import { 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Wallet, 
  Calendar, 
  Clock,
  ArrowRight,
  CreditCard,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/app/utils/api';
import Link from 'next/link';

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
  const [error, setError] = useState('');

  // 🔹 Fetch full user from backend
  useEffect(() => {
    const fetchUser = async () => {
      if (typeof window === "undefined") return;

      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          setError('User not found');
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser?._id) {
          setError('Invalid user data');
          return;
        }

        const response = await api.get(`/user/${parsedUser._id}`);
        const userData: UserType = response.data.data || response.data;
        setUser(userData);
        setError('');
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!user) {
    return <div className="text-center py-8 text-red-600">User not found</div>;
  }

  return (
    <div className="p-4 md:p-6">
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
        className="mb-6 md:mb-8"
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

      {/* Earnings Overview - Responsive Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8"
      >
        {/* Total Earnings Card */}
        <Link href="/user/earnings">
          <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-green-100 rounded-full mr-3 md:mr-4">
                  <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Total Earnings</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {formatCurrency(user.totalEarnings || 0)}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            </div>
            <div className="mt-3 md:mt-4 text-xs md:text-sm">
              <span className="text-gray-500">All-time earnings from games</span>
            </div>
          </div>
        </Link>

        {/* Daily Earnings Card */}
        <Link href="/user/earnings?period=daily">
          <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-blue-100 rounded-full mr-3 md:mr-4">
                  <Calendar className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Today's Earnings</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {formatCurrency(user.dailyEarnings || 0)}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            </div>
            <div className="mt-3 md:mt-4 text-xs md:text-sm">
              <span className="text-gray-500">Earnings for today</span>
            </div>
          </div>
        </Link>

        {/* Weekly Earnings Card */}
        <Link href="/user/earnings?period=weekly">
          <div className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 md:p-3 bg-purple-100 rounded-full mr-3 md:mr-4">
                  <Clock className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-600">Weekly Earnings</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {formatCurrency(user.weeklyEarnings || 0)}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            </div>
            <div className="mt-3 md:mt-4 text-xs md:text-sm">
              <span className="text-gray-500">Earnings this week</span>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm mb-6 md:mb-8"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg md:text-xl font-bold text-gray-900">Quick Actions</h3>
          <Link href="/user/wallet" className="text-blue-600 hover:text-blue-800 text-xs md:text-sm">
            View all
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Deposit Action */}
          <button
            onClick={() => router.push('/user/wallet/deposit')}
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full"
          >
            <div className="p-2 bg-green-100 rounded-full mr-3 md:mr-4">
              <Plus className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-gray-900 text-sm md:text-base">Deposit Funds</p>
              <p className="text-xs md:text-sm text-gray-600">Add money to your wallet</p>
            </div>
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          </button>

          {/* Withdraw Action */}
          <button
            onClick={() => router.push('/user/wallet/withdraw')}
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full"
          >
            <div className="p-2 bg-blue-100 rounded-full mr-3 md:mr-4">
              <Download className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-gray-900 text-sm md:text-base">Withdraw Funds</p>
              <p className="text-xs md:text-sm text-gray-600">Transfer to your account</p>
            </div>
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
          </button>
        </div>
      </motion.div>

      {/* Account Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.4 }}
        className="bg-white p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm"
      >
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Account Summary</h3>
        
        {/* Mobile view - cards */}
        <div className="md:hidden space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="font-medium text-gray-900 text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Account Status</span>
              <span className={`font-medium text-sm ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">User Role</span>
              <span className="font-medium text-gray-900 text-sm capitalize">
                {user.role.replace('-', ' ')}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Phone Number</span>
              <span className="font-medium text-gray-900 text-sm">{user.phone}</span>
            </div>
          </div>
        </div>
        
        {/* Desktop view - grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
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