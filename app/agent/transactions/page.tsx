'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Send,
  DollarSign,
  CreditCard,
  Wallet,
  ExternalLink,
  X as XIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '@/app/utils/api';
import Swal from 'sweetalert2';
import { method } from 'lodash';

type TransactionType = {
  _id: string;
  userId: {
    _id: string;
    phone: string;
    name?: string;
  };
  type: 'deposit' | 'withdrawal' | 'game_purchase' | 'winning';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  description: string;
  transactionId?: string;
  senderPhone?: string;
  receiverPhone?: string;
  reason?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  senderName?: string;
  receiverName?: string;
  method?: string;
};

type PaginationType = {
  current: number;
  total: number;
  count: number;
  totalRecords: number;
};

type StatsType = {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalWinnings: number;
  totalGamePurchases: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  netBalance: number;
  recentTransactions: TransactionType[];
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [pagination, setPagination] = useState<PaginationType>({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [reason, setReason] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    method: '',
    search: '',
    startDate: '',
    endDate: '',
    page: 1
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filters]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    
    Toast.fire({
      icon: type,
      title: message
    });
  };

  const showConfirmation = (title: string, text: string, confirmButtonText: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText
    });
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.method) params.append('method', filters.method);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page.toString());
      
      const res = await api.get(`/transactions?${params.toString()}`);
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      showToast('Failed to fetch transactions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/transactions/stats/overview');
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      showToast('Failed to fetch statistics', 'error');
    }
  };

  const handleViewTransaction = (transaction: TransactionType) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
    setAction(null);
    setReason('');
    setTransactionId('');
  };

  const handleAction = (actionType: 'approve' | 'reject' | 'complete') => {
    setAction(actionType);
  };

  const submitAction = async () => {
    if (!selectedTransaction) return;

    try {
      if (selectedTransaction.type === 'deposit' || selectedTransaction.type === 'game_purchase' || selectedTransaction.type === 'winning') {
        if (action === 'approve') {
          const result = await showConfirmation(
            'Approve Deposit',
            'Are you sure you want to approve this deposit?',
            'Yes, approve it!'
          );
          
          if (result.isConfirmed) {
            await api.put(`/transactions/deposit/${selectedTransaction._id}`, {
              status: 'completed'
            });
            showToast('Deposit approved successfully', 'success');
          }
        } else if (action === 'reject') {
          if (!reason.trim()) {
            showToast('Please provide a reason for rejection', 'warning');
            return;
          }
          
          const result = await showConfirmation(
            'Reject Deposit',
            'Are you sure you want to reject this deposit?',
            'Yes, reject it!'
          );
          
          if (result.isConfirmed) {
            await api.put(`/transactions/deposit/${selectedTransaction._id}`, {
              status: 'failed',
              reason
            });
            showToast('Deposit rejected successfully', 'success');
          }
        }
      } else if (selectedTransaction.type === 'withdrawal') {
        if (action === 'complete') {
          if (!transactionId.trim()) {
            showToast('Please provide a transaction ID', 'warning');
            return;
          }
          
          const result = await showConfirmation(
            'Complete Withdrawal',
            'Are you sure you want to mark this withdrawal as completed?',
            'Yes, complete it!'
          );
          
          if (result.isConfirmed) {
            await api.put(`/transactions/withdrawal/${selectedTransaction._id}`, {
              status: 'completed',
              transactionId
            });
            showToast('Withdrawal marked as completed', 'success');
          }
        }
      }

      setShowModal(false);
      fetchTransactions();
      fetchStats();
    } catch (error: any) {
      console.error('Failed to update transaction:', error);
      showToast(error.response?.data?.message || 'Failed to update transaction', 'error');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'failed': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {status}
      </span>
    );
  };

  const TypeBadge = ({ type }: { type: string }) => {
    const getTypeColor = () => {
      switch (type) {
        case 'deposit': return 'bg-blue-100 text-blue-800';
        case 'withdrawal': return 'bg-purple-100 text-purple-800';
        case 'winning': return 'bg-green-100 text-green-800';
        case 'game_purchase': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  const getTransactionLink = (transaction: TransactionType) => {
    if (!transaction.transactionId) return null;
    
    // Check if transactionId is already a URL
    if (transaction.transactionId.startsWith('http')) {
      return transaction.transactionId;
    }
    
    // Fallback to previous logic if transactionId is not a URL
    if (transaction.reference === 'cbe') {
      return `https://apps.cbe.com.et:100/?id=${transaction.transactionId}`;
    } else if (transaction.reference === 'telebirr') {
      return `https://telebirr.ethiotelecom.et/txn/${transaction.transactionId}`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Transaction Management</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white p-3 md:p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-1 md:p-2 bg-blue-100 rounded-full">
                <Wallet className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div className="ml-2 md:ml-3">
                <p className="text-xs md:text-sm text-gray-500">Total Deposits</p>
                <p className="text-sm md:text-base font-semibold">{stats.totalDeposits.toLocaleString()} ETB</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 md:p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-1 md:p-2 bg-purple-100 rounded-full">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <div className="ml-2 md:ml-3">
                <p className="text-xs md:text-sm text-gray-500">Total Withdrawals</p>
                <p className="text-sm md:text-base font-semibold">{stats.totalWithdrawals.toLocaleString()} ETB</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 md:p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-1 md:p-2 bg-yellow-100 rounded-full">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
              </div>
              <div className="ml-2 md:ml-3">
                <p className="text-xs md:text-sm text-gray-500">Pending Deposits</p>
                <p className="text-sm md:text-base font-semibold">{stats.pendingDeposits}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-3 md:p-4 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-1 md:p-2 bg-yellow-100 rounded-full">
                <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
              </div>
              <div className="ml-2 md:ml-3">
                <p className="text-xs md:text-sm text-gray-500">Pending Withdrawals</p>
                <p className="text-sm md:text-base font-semibold">{stats.pendingWithdrawals}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-4 md:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 font-sans">Type</label>
            <select 
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full p-2 text-xs md:text-sm border border-gray-300 rounded-md font-sans"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="game_purchase">Game Purchase</option>
              <option value="winning">Winning</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 font-sans">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full p-2 text-xs md:text-sm border border-gray-300 rounded-md font-sans"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 font-sans">Payment Method</label>
            <select 
              value={filters.method}
              onChange={(e) => setFilters({...filters, method: e.target.value})}
              className="w-full p-2 text-xs md:text-sm border border-gray-300 rounded-md font-sans"
            >
              <option value="">All Methods</option>
              <option value="telebirr">Telebirr</option>
              <option value="cbe">CBE</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 font-sans">Start Date</label>
            <input 
              type="date" 
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="w-full p-2 text-xs md:text-sm border border-gray-300 rounded-md font-sans"
            />
          </div>
          
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 font-sans">End Date</label>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="w-full p-2 text-xs md:text-sm border border-gray-300 rounded-md font-sans"
            />
          </div>
          
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 font-sans">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pl-9 p-2 text-xs md:text-sm border border-gray-300 rounded-md font-sans"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-2">
          <button 
            onClick={() => setFilters({
              type: '',
              status: '',
              method: '',
              search: '',
              startDate: '',
              endDate: '',
              page: 1
            })}
            className="px-3 py-2 text-xs md:text-sm bg-gray-200 text-gray-700 rounded-md font-sans"
          >
            Clear Filters
          </button>
          <button 
            onClick={fetchTransactions}
            className="px-3 py-2 text-xs md:text-sm bg-blue-600 text-white rounded-md flex items-center justify-center font-sans"
          >
            <Filter className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Mobile View - Cards */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="p-4 text-center font-sans">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-4 text-center font-sans">
              No transactions found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900 font-sans">
                        {transaction.userId.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 font-sans">
                        {transaction.userId.phone}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <TypeBadge type={transaction.type} />
                      <div className="mt-1">
                        <StatusBadge status={transaction.status} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-600 font-sans">
                      {transaction.amount.toLocaleString()} ETB
                    </span>
                    <span className="text-xs text-gray-500 font-sans capitalize">
                      {transaction.method}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-sans">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => handleViewTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-sans">User</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-sans">Type</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-sans">Amount</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-sans">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-sans">Method</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-sans">Date</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-sans">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 md:px-6 py-4 text-center font-sans">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 md:px-6 py-4 text-center font-sans">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-sans">
                          {transaction.userId.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 font-sans">
                          {transaction.userId.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <TypeBadge type={transaction.type} />
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-sans">
                      {transaction.amount.toLocaleString()} ETB
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={transaction.status} />
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize font-sans">
                      {transaction.method}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-sans">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-sans">
                Showing <span className="font-medium">{(pagination.current - 1) * 10 + 1}</span> to{' '}
                <span className="font-medium">{(pagination.current - 1) * 10 + pagination.count}</span> of{' '}
                <span className="font-medium">{pagination.totalRecords}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button 
                  onClick={() => setFilters({...filters, page: pagination.current - 1})}
                  disabled={pagination.current === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 font-sans"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setFilters({...filters, page: pagination.current + 1})}
                  disabled={pagination.current === pagination.total}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 font-sans"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold font-sans">Transaction Details</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XIcon className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                {/* Basic Info Card */}
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2 font-sans">Transaction Information</h4>
                  <div className="space-y-2 md:space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Transaction ID</p>
                      <p className="text-xs md:text-sm font-mono break-all">{selectedTransaction._id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Type</p>
                      <p className="text-sm font-medium capitalize font-sans">{selectedTransaction.type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Status</p>
                      <p className={`capitalize text-sm font-medium font-sans ${selectedTransaction.status === 'completed' ? 'text-green-500' : selectedTransaction.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                        {selectedTransaction.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Amount</p>
                      <p className={`font-semibold text-sm md:text-base font-sans ${selectedTransaction.type === 'deposit' ||  selectedTransaction.type === 'game_purchase' ||  selectedTransaction.type === 'winning' ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedTransaction.amount.toLocaleString()} ETB
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Reference</p>
                      <p className="text-sm font-medium capitalize font-sans">{selectedTransaction.reference}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Method</p>
                      <p className="text-sm font-medium capitalize font-sans">{selectedTransaction.method || selectedTransaction.reference}</p>
                    </div>
                  </div>
                </div>

                {/* User Info Card */}
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2 font-sans">User Information</h4>
                  <div className="space-y-2 md:space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Name</p>
                      <p className="text-sm font-medium font-sans">{selectedTransaction.userId.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Phone</p>
                      <p className="text-sm font-medium font-sans">{selectedTransaction.userId.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-sans">User ID</p>
                      <p className="text-xs md:text-sm font-mono break-all">{selectedTransaction.userId._id}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline Card */}
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2 font-sans">Timeline</h4>
                  <div className="space-y-2 md:space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Created</p>
                      <p className="text-xs md:text-sm font-sans">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Updated</p>
                      <p className="text-xs md:text-sm font-sans">{new Date(selectedTransaction.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Parties Card */}
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2 font-sans">Parties Involved</h4>
                  <div className="space-y-2 md:space-y-3">
                    {selectedTransaction.senderPhone && (
                      <div>
                        <p className="text-xs text-gray-500 font-sans">Sender Phone</p>
                        <p className="text-xs md:text-sm font-sans">{selectedTransaction.senderPhone}</p>
                        {selectedTransaction.senderName && (
                          <p className="text-xs text-gray-500 font-sans">({selectedTransaction.senderName})</p>
                        )}
                      </div>
                    )}
                    {selectedTransaction.receiverPhone && (
                      <div>
                        <p className="text-xs text-gray-500 font-sans">Receiver Phone</p>
                        <p className="text-xs md:text-sm font-sans">{selectedTransaction.receiverPhone}</p>
                        {selectedTransaction.receiverName && (
                          <p className="text-xs text-gray-500 font-sans">({selectedTransaction.receiverName})</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info Card */}
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:col-span-2">
                  <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2 font-sans">Additional Information</h4>
                  <div className="space-y-2 md:space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Description</p>
                      <p className="text-xs md:text-sm font-sans">{selectedTransaction.description}</p>
                    </div>
                    {selectedTransaction.transactionId && (
                      <div>
                        <p className="text-xs text-gray-500 font-sans">Transaction ID/Link</p>
                        {getTransactionLink(selectedTransaction) ? (
                          <a 
                            href={getTransactionLink(selectedTransaction) as string}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800 text-xs md:text-sm break-all"
                          >
                            <ExternalLink className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                            {selectedTransaction.transactionId}
                          </a>
                        ) : (
                          <p className="text-xs md:text-sm font-mono break-all">{selectedTransaction.transactionId}</p>
                        )}
                      </div>
                    )}
                    {selectedTransaction.reason && (
                      <div>
                        <p className="text-xs text-gray-500 font-sans">Reason</p>
                        <p className="text-xs md:text-sm text-red-500 font-sans">{selectedTransaction.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons for Admin */}
              {selectedTransaction.status === 'pending' && (
                <div className="mt-4 md:mt-6 border-t pt-4">
                  {selectedTransaction.type === 'deposit' || selectedTransaction.type === 'game_purchase' || selectedTransaction.type === 'winning' ? (
                    <>
                      <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2 font-sans">Deposit Actions</h4>
                      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                        <button 
                          onClick={() => handleAction('approve')}
                          className="flex items-center justify-center px-3 py-2 text-xs md:text-sm bg-green-600 text-white rounded-md font-sans"
                        >
                          <Check className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction('reject')}
                          className="flex items-center justify-center px-3 py-2 text-xs md:text-sm bg-red-600 text-white rounded-md font-sans"
                        >
                          <X className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                      
                      {action === 'reject' && (
                        <div className="mt-3 md:mt-4">
                          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 font-sans">Reason for rejection</label>
                          <textarea 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-2 text-xs md:text-sm border border-gray-300 rounded-md font-sans"
                            rows={3}
                            placeholder="Enter reason for rejection"
                          />
                          <button 
                            onClick={submitAction}
                            className="mt-2 px-3 py-2 text-xs md:text-sm bg-red-600 text-white rounded-md flex items-center justify-center font-sans"
                          >
                            <Send className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            Submit Rejection
                          </button>
                        </div>
                      )}
                      
                      {action === 'approve' && (
                        <div className="mt-3 md:mt-4">
                          <p className="text-xs md:text-sm text-gray-600 mb-2 font-sans">Are you sure you want to approve this deposit?</p>
                          <button 
                            onClick={submitAction}
                            className="px-3 py-2 text-xs md:text-sm bg-green-600 text-white rounded-md flex items-center justify-center font-sans"
                          >
                            <Check className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            Confirm Approval
                          </button>
                        </div>
                      )}
                    </>
                  ) : selectedTransaction.type === 'withdrawal' ? (
                    <>
                      <h4 className="text-xs md:text-sm font-medium text-gray-500 mb-2 font-sans">Withdrawal Actions</h4>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleAction('complete')}
                          className="flex items-center justify-center px-3 py-2 text-xs md:text-sm bg-green-600 text-white rounded-md font-sans"
                        >
                          <Check className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                          Mark as Completed
                        </button>
                      </div>
                      
                      {action === 'complete' && (
                        <div className="mt-3 md:mt-4">
                          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 font-sans">Transaction ID</label>
                          <input 
                            type="text" 
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full p-2 text-xs md:text-sm border border-gray-300 rounded-md font-sans"
                            placeholder="Enter transaction ID"
                          />
                          <button 
                            onClick={submitAction}
                            className="mt-2 px-3 py-2 text-xs md:text-sm bg-green-600 text-white rounded-md flex items-center justify-center font-sans"
                          >
                            <Send className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            Confirm Completion
                          </button>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}