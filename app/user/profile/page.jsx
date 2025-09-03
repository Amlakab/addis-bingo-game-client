// app/user/profile/page.jsx
'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import MobileHeader from '@/components/Layout/MobileHeader';
import MobileNavigation from '@/components/Layout/MobileNavigation';
import { formatCurrency } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="Profile" showWallet={false} />
      
      <div className="p-4 space-y-6 pb-24 pt-16">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <p className="mt-1 text-lg">{user.phone}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type</label>
              <p className="mt-1 text-lg capitalize">{user.role}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Status</label>
              <p className="mt-1 text-lg">{user.isActive ? 'Active' : 'Inactive'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-lg">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Wallet Summary */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Wallet Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Current Balance:</span>
              <span className="font-semibold">{formatCurrency(user.wallet || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Daily Earnings:</span>
              <span className="font-semibold">{formatCurrency(user.dailyEarnings || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Weekly Earnings:</span>
              <span className="font-semibold">{formatCurrency(user.weeklyEarnings || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Earnings:</span>
              <span className="font-semibold">{formatCurrency(user.totalEarnings || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}