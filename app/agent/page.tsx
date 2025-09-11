// app/admin/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, TrendingUp, TrendingDown, ArrowUp, ArrowDown,
  ArrowRight, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import api from '@/app/utils/api';

// Interface definitions
interface User {
  _id: string;
  phone: string;
  role: 'user' | 'agent' | 'admin';
  wallet: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: string;
}

interface Transaction {
  _id: string;
  userId: {
    _id: string;
    phone: string;
  };
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  description: string;
  createdAt: string;
}

interface DashboardStats {
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  todayEarnings: number;
  transactionGrowth: number;
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && user?.role !== 'agent') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === 'agent') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch transactions data
      const transactionsRes = await api.get('/transactions?limit=100');
      const allTransactions: Transaction[] = transactionsRes.data.data;
      
      // Calculate stats
      const totalTransactions = allTransactions.length;
      const pendingTransactions = allTransactions.filter(t => t.status === 'pending').length;
      const completedTransactions = allTransactions.filter(t => t.status === 'completed').length;
      const failedTransactions = allTransactions.filter(t => t.status === 'failed').length;
      
      // Calculate today's earnings (only from completed transactions)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEarnings = allTransactions
        .filter(t => t.status === 'completed' && new Date(t.createdAt) >= today)
        .reduce((sum, t) => sum + t.amount, 0);

      // Get 5 most recent transactions
      const recent = [...allTransactions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStatsData({
        totalTransactions,
        pendingTransactions,
        completedTransactions,
        failedTransactions,
        todayEarnings,
        transactionGrowth: calculateGrowth(totalTransactions, 100) // Example calculation
      });

      setRecentTransactions(recent);
      setError('');
    } catch (error: any) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate growth percentage
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  };

  // Helper function to format time difference
  const formatTimeDifference = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user?.role !== 'agent') {
    return <div className="text-center py-8 text-red-600">Access denied. Agent only.</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!statsData) {
    return <div className="text-center py-8">No data available</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Agent Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Transactions Card */}
        <Link href="/admin/transactions">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full mr-4">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">{statsData.totalTransactions}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+{statsData.transactionGrowth}%</span>
              <span className="text-gray-500 ml-2">from last week</span>
            </div>
          </div>
        </Link>
        
        {/* Pending Transactions Card */}
        <Link href="/admin/transactions?status=pending">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full mr-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{statsData.pendingTransactions}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Requires attention</span>
            </div>
          </div>
        </Link>
        
        {/* Completed Transactions Card */}
        <Link href="/admin/transactions?status=completed">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full mr-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{statsData.completedTransactions}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">Successfully processed</span>
            </div>
          </div>
        </Link>
        
        {/* Failed Transactions Card */}
        <Link href="/admin/transactions?status=failed">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full mr-4">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold">{statsData.failedTransactions}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Need resolution</span>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <Link href="/admin/transactions" className="text-blue-600 hover:text-blue-800 text-sm">
            View all transactions
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTransactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.userId?.phone || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                    {transaction.type.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      {getStatusIcon(transaction.status)}
                      <span className={`ml-1 ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeDifference(new Date(transaction.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}