// app/user/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import { formatCurrency } from '@/lib/utils';
import { User, Phone, Shield, Calendar, Wallet, TrendingUp, CreditCard, Edit } from 'lucide-react';


export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet'>('profile');

  useEffect(() => {
    // Simulate API call to fetch user data
    const fetchUser = async () => {
      try {
        // In a real app, you would fetch from your API
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } else {
          // Fallback mock data
          setUser({
            _id: '1',
            phone: '+251912345678',
            role: 'user',
            wallet: 1250.75,
            dailyEarnings: 125.50,
            weeklyEarnings: 850.25,
            totalEarnings: 5250.00,
            isActive: true,
            createdAt: '2023-05-15T10:30:00.000Z',
            updatedAt: '2024-01-20T14:45:00.000Z'
          });
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Fallback mock data on error
        setUser({
          _id: '1',
          phone: '+251912345678',
          role: 'user',
          wallet: 1250.75,
          dailyEarnings: 125.50,
          weeklyEarnings: 850.25,
          totalEarnings: 5250.00,
          isActive: true,
          createdAt: '2023-05-15T10:30:00.000Z',
          updatedAt: '2024-01-20T14:45:00.000Z'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Profile" showWallet={false} />
        <div className="pt-16 pb-24 px-4">
          <p className="text-center mt-10 text-gray-500">Loading...</p>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MobileHeader title="Profile" showWallet={false} />
        <div className="pt-16 pb-24 px-4">
          <p className="text-center mt-10 text-gray-500">User not found</p>
        </div>
        <MobileNavigation />
      </div>
    );
  }

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
        <button className="p-2 text-blue-600 rounded-full hover:bg-blue-50">
          <Edit className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Phone className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Phone Number</p>
            <p className="font-medium">{user.phone}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Shield className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Account Type</p>
            <p className="font-medium capitalize">{user.role}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Shield className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Account Status</p>
            <p className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <Calendar className="h-5 w-5 text-gray-500 mr-3" />
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
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
          <span className="font-semibold text-blue-700">{formatCurrency(user.wallet)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <span className="text-green-700">Daily Earnings:</span>
          <span className="font-semibold text-green-700">{formatCurrency(user.dailyEarnings)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
          <span className="text-yellow-700">Weekly Earnings:</span>
          <span className="font-semibold text-yellow-700">{formatCurrency(user.weeklyEarnings)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
          <span className="text-purple-700">Total Earnings:</span>
          <span className="font-semibold text-purple-700">{formatCurrency(user.totalEarnings)}</span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Profile" showWallet={false} />
      
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

        {/* Additional Stats Card */}
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-blue-600 mb-1">Games Played</p>
              <p className="font-semibold">24</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-600 mb-1">Games Won</p>
              <p className="font-semibold">8</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-sm text-yellow-600 mb-1">Win Rate</p>
              <p className="font-semibold">33%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-sm text-purple-600 mb-1">Avg. Earnings</p>
              <p className="font-semibold">{formatCurrency(125)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <MobileNavigation />
    </div>
  );
}