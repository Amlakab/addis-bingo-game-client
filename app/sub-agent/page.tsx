'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import MobileHeader from '@/components/sub-agent/MobileHeader';
import MobileNavigation from '@/components/sub-agent/MobileNavigation';
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
  Download,
  Trophy,
  Play,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/app/utils/api';
import Link from 'next/link';
import Footer from '@/components/ui/Footer';

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <MobileHeader title="Dashboard" />
        <div className="flex items-center justify-center h-screen w-full pt-16 pb-16">
          <div className="text-center text-red-600">User not found</div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <MobileHeader title="Dashboard" />
        <div className="flex items-center justify-center h-screen w-full pt-16 pb-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 w-full">
        <MobileHeader title="Dashboard" />
        <div className="flex items-center justify-center h-screen w-full pt-16 pb-16">
          <div className="text-center text-red-600">{error}</div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <MobileHeader title="Dashboard" />

      <main className="px-4 pb-24 pt-16 w-full max-w-full mx-auto overflow-x-hidden">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center w-full mb-6 pt-4"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user.phone}!</h2>
          <p className="text-gray-600">Manage your funds and track earnings</p>
        </motion.div>

        {/* Main Wallet Balance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="w-full mb-6"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-xl font-bold">Wallet Balance</h3>
              <Wallet className="h-6 w-6 text-blue-200" />
            </div>
            
            <div className="text-center mb-6">
              <p className="text-blue-100 text-sm mb-2">Available Balance</p>
              <p className="text-3xl font-bold">{formatCurrency(user.wallet || 0)}</p>
            </div>

            <button
              className="w-full bg-white text-blue-600 hover:bg-gray-100 py-3 rounded-md font-medium flex items-center justify-center transition-colors"
              onClick={() => router.push('/user/wallet')}
            >
              <Plus className="h-5 w-5 mr-2" /> Add Funds
            </button>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="grid grid-cols-3 gap-4 w-full mb-6"
        >
          <div className="bg-white p-4 rounded-lg text-center shadow-sm w-full">
            <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{formatCurrency(user.totalEarnings || 0)}</p>
            <p className="text-xs text-gray-600">Total</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center shadow-sm w-full">
            <Calendar className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{formatCurrency(user.dailyEarnings || 0)}</p>
            <p className="text-xs text-gray-600">Daily</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center shadow-sm w-full">
            <Clock className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-gray-900">{formatCurrency(user.weeklyEarnings || 0)}</p>
            <p className="text-xs text-gray-600">Weekly</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }}
          className="bg-white p-4 rounded-lg shadow-sm mb-6 w-full"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Link href="/user/wallet" className="text-blue-600 hover:text-blue-800 text-sm">
              View all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-3 w-full">
            {/* Deposit Action */}
            <button
              onClick={() => router.push('/user/wallet/deposit')}
              className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full"
            >
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <Plus className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-gray-900 text-sm">Deposit Funds</p>
                <p className="text-xs text-gray-600">Add money to your wallet</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </button>

            {/* Withdraw Action */}
            <button
              onClick={() => router.push('/user/wallet/withdraw')}
              className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full"
            >
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <Download className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-gray-900 text-sm">Withdraw Funds</p>
                <p className="text-xs text-gray-600">Transfer to your account</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </motion.div>

        {/* Account Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }}
          className="bg-white p-4 rounded-lg shadow-sm w-full"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h3>
          
          <div className="space-y-3 w-full">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="font-medium text-gray-900 text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Account Status</span>
              <span className={`font-medium text-sm ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">User Role</span>
              <span className="font-medium text-gray-900 text-sm capitalize">
                {user.role.replace('-', ' ')}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Phone Number</span>
              <span className="font-medium text-gray-900 text-sm">{user.phone}</span>
            </div>
          </div>
        </motion.div>

        {/* Earnings Overview - Compact Version */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5 }}
          className="w-full mb-6 mt-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Overview</h3>
          
          <div className="bg-white p-4 rounded-lg shadow-sm w-full">
            <div className="space-y-4">
              {/* Total Earnings */}
              <Link href="/user/earnings">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-full mr-3">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Total Earnings</p>
                      <p className="text-xs text-gray-600">All-time earnings from games</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(user.totalEarnings || 0)}</p>
                    <ArrowRight className="h-4 w-4 text-gray-400 ml-2" />
                  </div>
                </div>
              </Link>

              {/* Daily Earnings */}
              <Link href="/user/earnings?period=daily">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Today's Earnings</p>
                      <p className="text-xs text-gray-600">Earnings for today</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(user.dailyEarnings || 0)}</p>
                    <ArrowRight className="h-4 w-4 text-gray-400 ml-2" />
                  </div>
                </div>
              </Link>

              {/* Weekly Earnings */}
              <Link href="/user/earnings?period=weekly">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-full mr-3">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Weekly Earnings</p>
                      <p className="text-xs text-gray-600">Earnings this week</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(user.weeklyEarnings || 0)}</p>
                    <ArrowRight className="h-4 w-4 text-gray-400 ml-2" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* <Footer /> */}
      <MobileNavigation />
    </div>
  );
}